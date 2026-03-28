import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import {
  MindbodyService,
  mapMindbodyClientStatus,
  mapMindbodyPlanType,
  mapVisitToBookingStatus,
} from "@/lib/services/mindbody.service";
import { calculateHealthScore } from "@/lib/utils/health-score";
import type { Client, Booking } from "@/lib/db/schemas";

// POST — Trigger a full Mindbody data sync
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Parse options
    const body = await request.json().catch(() => ({}));
    const lookbackMonths = Math.min(body.lookbackMonths || 6, 12); // cap at 12

    const db = await getDatabase();
    const service = await MindbodyService.fromDatabase();

    const now = new Date();
    const lookbackStart = new Date(now);
    lookbackStart.setMonth(lookbackStart.getMonth() - lookbackMonths);

    const summary = {
      clients: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      visits: { imported: 0, skipped: 0 },
      contracts: { imported: 0 },
      startedAt: now.toISOString(),
      completedAt: "",
    };

    // --- Step 1: Pull all clients ---
    const mbClients = await service.getAllClients();

    // Build a map of existing clients by email for fast lookup
    const existingClients = await db.collection<Client>("clients").find(
      {},
      { projection: { email: 1, mindbodyClientId: 1, _id: 1 } }
    ).toArray();
    const emailToClient = new Map(existingClients.map((c) => [c.email.toLowerCase(), c]));

    // Track mindbodyClientId → FlexiWell _id for visit import
    const mbIdToClientId = new Map<string, string>();

    for (const mbClient of mbClients) {
      try {
        if (!mbClient.Email) {
          summary.clients.skipped++;
          continue;
        }

        const email = mbClient.Email.toLowerCase().trim();
        const existing = emailToClient.get(email);

        if (existing) {
          // Update: add mindbodyClientId, don't overwrite FlexiWell-specific fields
          await db.collection<Client>("clients").updateOne(
            { _id: existing._id },
            {
              $set: {
                mindbodyClientId: String(mbClient.Id),
                updatedAt: now,
              },
            }
          );
          mbIdToClientId.set(String(mbClient.Id), String(existing._id));
          summary.clients.updated++;
        } else {
          // New client — create with Mindbody data
          const status = mapMindbodyClientStatus(mbClient);
          const newClient: Client = {
            name: `${mbClient.FirstName || ""} ${mbClient.LastName || ""}`.trim(),
            email,
            phone: mbClient.MobilePhone || mbClient.HomePhone || "",
            mindbodyClientId: String(mbClient.Id),
            dateOfBirth: mbClient.BirthDate ? new Date(mbClient.BirthDate) : undefined,
            gender: mbClient.Gender || undefined,
            plan: {
              type: "monthly",
              totalClasses: 8,
              usedClasses: 0,
              remainingClasses: 8,
              startDate: mbClient.CreationDate ? new Date(mbClient.CreationDate) : now,
              endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
              price: 0,
            },
            status,
            lifecycleStage: status === "active" ? "active" : "lead",
            preferences: {
              notifications: { email: true, whatsapp: false, instagram: false, sms: false },
            },
            createdAt: now,
            updatedAt: now,
          };

          // Add address if available
          if (mbClient.Address) {
            (newClient as unknown as Record<string, unknown>).address = {
              line1: mbClient.Address.AddressLine1,
              city: mbClient.Address.City,
              state: mbClient.Address.State,
              postalCode: mbClient.Address.PostalCode,
              country: mbClient.Address.Country,
            };
          }

          if (mbClient.EmergencyContactInfoName) {
            newClient.emergencyContact = {
              name: mbClient.EmergencyContactInfoName,
              phone: mbClient.EmergencyContactInfoPhone || "",
              relationship: "",
            };
          }

          const result = await db.collection<Client>("clients").insertOne(newClient);
          mbIdToClientId.set(String(mbClient.Id), String(result.insertedId));
          emailToClient.set(email, { ...newClient, _id: result.insertedId } as any);
          summary.clients.imported++;
        }
      } catch (err) {
        console.error(`Error importing Mindbody client ${mbClient.Id}:`, err);
        summary.clients.errors++;
      }
    }

    // --- Step 2: Pull visit history for each client ---
    // Get existing imported visit IDs to avoid duplicates
    const existingVisitIds = new Set(
      (await db.collection<Booking>("bookings")
        .find({ source: "mindbody-import" }, { projection: { mindbodyVisitId: 1 } })
        .toArray()
      ).map((b: any) => b.mindbodyVisitId).filter(Boolean)
    );

    for (const mbClient of mbClients) {
      const clientId = mbIdToClientId.get(String(mbClient.Id));
      if (!clientId) continue;

      try {
        const visits = await service.getClientVisits(String(mbClient.Id), lookbackStart, now);

        for (const visit of visits) {
          if (existingVisitIds.has(String(visit.Id))) {
            summary.visits.skipped++;
            continue;
          }

          const startDt = new Date(visit.StartDateTime);
          const endDt = new Date(visit.EndDateTime);

          const booking: Booking = {
            clientId,
            clientName: `${mbClient.FirstName || ""} ${mbClient.LastName || ""}`.trim(),
            classId: String(visit.ClassId),
            className: visit.ClassName || "Unknown Class",
            instructorId: "",
            instructorName: visit.StaffName || "",
            scheduledDate: startDt,
            startTime: startDt.toTimeString().slice(0, 5),
            endTime: endDt.toTimeString().slice(0, 5),
            status: mapVisitToBookingStatus(visit),
            source: "mindbody-import",
            createdAt: now,
            updatedAt: now,
          };

          // Store Mindbody visit ID for dedup
          (booking as unknown as Record<string, unknown>).mindbodyVisitId = String(visit.Id);

          await db.collection<Booking>("bookings").insertOne(booking);
          existingVisitIds.add(String(visit.Id));
          summary.visits.imported++;
        }
      } catch (err) {
        console.error(`Error importing visits for client ${mbClient.Id}:`, err);
      }
    }

    // --- Step 3: Pull contracts/memberships ---
    for (const mbClient of mbClients) {
      const clientId = mbIdToClientId.get(String(mbClient.Id));
      if (!clientId) continue;

      try {
        const contracts = await service.getClientContracts(String(mbClient.Id));
        // Use the most recent active contract to set the client's plan
        const activeContract = contracts.find((c) => c.IsActive);
        if (activeContract) {
          const planType = mapMindbodyPlanType(activeContract.ContractName);
          await db.collection<Client>("clients").updateOne(
            { _id: { $eq: clientId } as any },
            {
              $set: {
                "plan.type": planType,
                "plan.startDate": new Date(activeContract.StartDate),
                "plan.endDate": activeContract.EndDate ? new Date(activeContract.EndDate) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
                "plan.price": activeContract.AutopaySchedule?.Amount || 0,
                "plan.remainingClasses": activeContract.RemainingSessionCount ?? 999,
                updatedAt: now,
              },
            }
          );
          summary.contracts.imported++;
        }
      } catch (err) {
        console.error(`Error importing contracts for client ${mbClient.Id}:`, err);
      }
    }

    // --- Step 4: Calculate health scores for imported clients ---
    for (const mbClient of mbClients) {
      const clientId = mbIdToClientId.get(String(mbClient.Id));
      if (!clientId) continue;

      try {
        const client = await db.collection<Client>("clients").findOne({ _id: { $eq: clientId } as any });
        if (!client) continue;

        const bookings = await db.collection<Booking>("bookings")
          .find({ clientId })
          .toArray();

        const completed = bookings.filter((b) => b.status === "completed").length;
        const total = bookings.filter((b) => ["completed", "no-show", "cancelled"].includes(b.status)).length;
        const lastActivity = bookings
          .filter((b) => b.status === "completed")
          .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];

        const score = calculateHealthScore({
          completedBookings: completed,
          totalBookings: total || 1,
          classesUsed: client.plan.usedClasses || completed,
          classesTotal: client.plan.totalClasses || 8,
          planStartDate: client.plan.startDate,
          planEndDate: client.plan.endDate,
          lastActivityDate: lastActivity?.scheduledDate || null,
          totalPayments: 1,
          failedPayments: 0,
          latePayments: 0,
        });

        await db.collection<Client>("clients").updateOne(
          { _id: { $eq: clientId } as any },
          {
            $set: {
              healthScore: {
                overall: score.overall,
                breakdown: score.breakdown,
                lastCalculatedAt: now,
              },
              churnRiskScore: 100 - score.overall,
              lifecycleStage: score.riskLevel === "critical" ? "at_risk" : score.riskLevel === "at_risk" ? "at_risk" : "active",
              lastClassDate: lastActivity?.scheduledDate || undefined,
              updatedAt: now,
            },
          }
        );
      } catch (err) {
        console.error(`Error calculating health score for client ${mbClient.Id}:`, err);
      }
    }

    summary.completedAt = new Date().toISOString();

    // Save sync log
    await db.collection("mindbody_sync_logs").insertOne({
      ...summary,
      syncedBy: user.email || user.name,
    });

    return NextResponse.json({
      success: true,
      summary,
      message: `Sync complete: ${summary.clients.imported} new clients, ${summary.clients.updated} updated, ${summary.visits.imported} visits imported.`,
    });
  } catch (error: any) {
    console.error("Mindbody sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync with Mindbody" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

// GET — Last sync status and stats
export async function GET() {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();

    // Get most recent sync log
    const lastSync = await db.collection("mindbody_sync_logs")
      .findOne({}, { sort: { startedAt: -1 } });

    // Get current counts
    const totalImportedClients = await db.collection("clients")
      .countDocuments({ mindbodyClientId: { $exists: true } });
    const totalImportedVisits = await db.collection("bookings")
      .countDocuments({ source: "mindbody-import" });

    // Check if credentials are configured
    const creds = await db.collection("integration_credentials")
      .findOne({ provider: "mindbody" });

    return NextResponse.json({
      connected: !!creds?.isActive,
      lastSync: lastSync ? {
        startedAt: lastSync.startedAt,
        completedAt: lastSync.completedAt,
        clients: lastSync.clients,
        visits: lastSync.visits,
        contracts: lastSync.contracts,
      } : null,
      totals: {
        clients: totalImportedClients,
        visits: totalImportedVisits,
      },
    });
  } catch (error) {
    console.error("Mindbody status error:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}

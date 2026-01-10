import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { AuthorizedClient } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// Detectar tipo de identificador
function detectIdentifierType(
  identifier: string
): "email" | "phone" | "cpf" | null {
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
    return "email";
  }
  // CPF (11 dígitos)
  const cleanCpf = identifier.replace(/\D/g, "");
  if (cleanCpf.length === 11) {
    return "cpf";
  }
  // Telefone (10-11 dígitos para Brasil)
  const cleanPhone = identifier.replace(/\D/g, "");
  if (cleanPhone.length >= 10 && cleanPhone.length <= 13) {
    return "phone";
  }
  return null;
}

// Normalizar identificador
function normalizeIdentifier(
  identifier: string,
  type: "email" | "phone" | "cpf"
): string {
  if (type === "email") {
    return identifier.toLowerCase().trim();
  }
  if (type === "cpf" || type === "phone") {
    return identifier.replace(/\D/g, "");
  }
  return identifier.trim();
}

// GET /api/company/authorized-clients - Listar clientes pré-autorizados
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can manage authorized clients" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "pending" | "claimed" | "all"

    const db = await getDatabase();

    const query: Record<string, unknown> = { companyId: user.userId };

    if (status === "pending") {
      query.claimedBy = { $exists: false };
    } else if (status === "claimed") {
      query.claimedBy = { $exists: true };
    }

    const clients = await db
      .collection<AuthorizedClient>("authorized_clients")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      clients: clients.map((client) => ({
        id: client._id?.toString(),
        identifier: client.identifier,
        identifierType: client.identifierType,
        name: client.name,
        isClaimed: !!client.claimedBy,
        claimedAt: client.claimedAt,
        invitedAt: client.invitedAt,
      })),
      total: clients.length,
      pending: clients.filter((c) => !c.claimedBy).length,
      claimed: clients.filter((c) => c.claimedBy).length,
    });
  } catch (error) {
    console.error("Error fetching authorized clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch authorized clients" },
      { status: 500 }
    );
  }
}

// POST /api/company/authorized-clients - Adicionar cliente(s) pré-autorizado(s)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can add authorized clients" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clients } = body; // Array de { identifier, name? }

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json(
        { error: "At least one client is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const results = {
      added: 0,
      skipped: 0,
      errors: [] as { identifier: string; error: string }[],
    };

    for (const clientData of clients) {
      const { identifier, name } = clientData;

      if (!identifier) {
        results.errors.push({ identifier: "", error: "Identifier is required" });
        continue;
      }

      const identifierType = detectIdentifierType(identifier);
      if (!identifierType) {
        results.errors.push({
          identifier,
          error: "Invalid identifier format (must be email, phone, or CPF)",
        });
        continue;
      }

      const normalizedIdentifier = normalizeIdentifier(identifier, identifierType);

      // Verificar se já existe
      const existing = await db
        .collection<AuthorizedClient>("authorized_clients")
        .findOne({
          companyId: user.userId,
          identifier: normalizedIdentifier,
        });

      if (existing) {
        results.skipped++;
        continue;
      }

      // Adicionar novo cliente autorizado
      const newClient: Omit<AuthorizedClient, "_id"> = {
        companyId: user.userId,
        identifier: normalizedIdentifier,
        identifierType,
        name: name || undefined,
        invitedBy: user.userId,
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db
        .collection<AuthorizedClient>("authorized_clients")
        .insertOne(newClient);
      results.added++;
    }

    return NextResponse.json({
      success: true,
      results,
      message: `${results.added} cliente(s) adicionado(s), ${results.skipped} já existente(s)`,
    });
  } catch (error) {
    console.error("Error adding authorized clients:", error);
    return NextResponse.json(
      { error: "Failed to add authorized clients" },
      { status: 500 }
    );
  }
}

// DELETE /api/company/authorized-clients - Remover cliente pré-autorizado
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can remove authorized clients" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("id");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db
      .collection<AuthorizedClient>("authorized_clients")
      .deleteOne({
        _id: new ObjectId(clientId),
        companyId: user.userId,
      });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Authorized client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing authorized client:", error);
    return NextResponse.json(
      { error: "Failed to remove authorized client" },
      { status: 500 }
    );
  }
}

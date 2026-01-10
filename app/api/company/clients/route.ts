import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { CompanyClient, CompanyInvite, AuthorizedClient, User } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/company/clients - Listar clientes vinculados à empresa
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can view company clients" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "active" | "inactive" | "all"

    const db = await getDatabase();

    const query: Record<string, unknown> = { companyId: user.userId };
    if (status && status !== "all") {
      query.status = status;
    }

    const companyClients = await db
      .collection<CompanyClient>("company_clients")
      .find(query)
      .sort({ joinedAt: -1 })
      .toArray();

    // Buscar dados dos usuários
    const userIds = companyClients.map((c) => new ObjectId(c.userId));
    const users = await db
      .collection<User>("users")
      .find({ _id: { $in: userIds } })
      .project({ password: 0 })
      .toArray();

    const usersMap = new Map(users.map((u) => [u._id?.toString(), u]));

    const clients = companyClients.map((cc) => {
      const userData = usersMap.get(cc.userId);
      return {
        id: cc._id?.toString(),
        userId: cc.userId,
        name: userData?.name || "Usuário não encontrado",
        email: userData?.email,
        phone: userData?.phone,
        avatar: userData?.avatar,
        joinedVia: cc.joinedVia,
        status: cc.status,
        role: cc.role,
        joinedAt: cc.joinedAt,
      };
    });

    return NextResponse.json({
      success: true,
      clients,
      total: clients.length,
      active: companyClients.filter((c) => c.status === "active").length,
      inactive: companyClients.filter((c) => c.status === "inactive").length,
    });
  } catch (error) {
    console.error("Error fetching company clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch company clients" },
      { status: 500 }
    );
  }
}

// POST /api/company/clients/join - Cliente se vincula à empresa via código
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apenas clientes podem usar código de convite
    if (user.role !== "client") {
      return NextResponse.json(
        { error: "Only clients can join companies" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Buscar código de convite
    const invite = await db.collection<CompanyInvite>("company_invites").findOne({
      code: inviteCode.toUpperCase(),
      isActive: true,
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Código de convite inválido ou expirado" },
        { status: 404 }
      );
    }

    // Verificar se código expirou
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Código de convite expirado" },
        { status: 400 }
      );
    }

    // Verificar limite de usos
    if (invite.maxUses && invite.currentUses >= invite.maxUses) {
      return NextResponse.json(
        { error: "Código de convite atingiu o limite de usos" },
        { status: 400 }
      );
    }

    // Verificar se já está vinculado a esta empresa
    const existingLink = await db.collection<CompanyClient>("company_clients").findOne({
      userId: user.userId,
      companyId: invite.companyId,
    });

    if (existingLink) {
      return NextResponse.json(
        { error: "Você já está vinculado a esta empresa" },
        { status: 400 }
      );
    }

    // Criar vínculo
    const newCompanyClient: Omit<CompanyClient, "_id"> = {
      userId: user.userId,
      companyId: invite.companyId,
      joinedVia: "invite_code",
      inviteCodeUsed: invite.code,
      status: "active",
      role: "client",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection<CompanyClient>("company_clients").insertOne(newCompanyClient);

    // Incrementar uso do código
    await db.collection<CompanyInvite>("company_invites").updateOne(
      { _id: invite._id },
      {
        $inc: { currentUses: 1 },
        $set: { updatedAt: new Date() },
      }
    );

    // Buscar nome da empresa (usuário admin)
    const companyUser = await db.collection<User>("users").findOne({
      _id: new ObjectId(invite.companyId),
    });

    return NextResponse.json({
      success: true,
      message: "Vinculado com sucesso!",
      company: {
        id: invite.companyId,
        name: companyUser?.name || "Empresa",
      },
    });
  } catch (error) {
    console.error("Error joining company:", error);
    return NextResponse.json(
      { error: "Failed to join company" },
      { status: 500 }
    );
  }
}

// PATCH /api/company/clients - Atualizar status do cliente
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update client status" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clientId, status, role } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (role) updateData.role = role;

    const result = await db.collection<CompanyClient>("company_clients").updateOne(
      {
        _id: new ObjectId(clientId),
        companyId: user.userId,
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE /api/company/clients - Remover vínculo do cliente
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can remove clients" },
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

    const result = await db.collection<CompanyClient>("company_clients").deleteOne({
      _id: new ObjectId(clientId),
      companyId: user.userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing client:", error);
    return NextResponse.json(
      { error: "Failed to remove client" },
      { status: 500 }
    );
  }
}

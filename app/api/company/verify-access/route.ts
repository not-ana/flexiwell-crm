import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { CompanyClient, AuthorizedClient, User, CompanyInvite } from "@/lib/db/schemas";

// GET /api/company/verify-access - Verificar se cliente tem acesso a alguma empresa
// Usado após o login para verificar se precisa de código de convite
export async function GET() {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apenas para clientes
    if (user.role !== "client") {
      return NextResponse.json({
        success: true,
        hasAccess: true,
        role: user.role,
      });
    }

    const db = await getDatabase();

    // Verificar se já está vinculado a alguma empresa
    const existingLinks = await db
      .collection<CompanyClient>("company_clients")
      .find({
        userId: user.userId,
        status: "active",
      })
      .toArray();

    if (existingLinks.length > 0) {
      // Buscar nomes das empresas
      const companyIds = existingLinks.map((l) => l.companyId);
      const companies = await db
        .collection<User>("users")
        .find({
          _id: { $in: companyIds.map((id) => {
            try {
              const { ObjectId } = require("mongodb");
              return new ObjectId(id);
            } catch {
              return id;
            }
          }) },
        })
        .toArray();

      const companiesMap = new Map(
        companies.map((c) => [c._id?.toString(), c])
      );

      return NextResponse.json({
        success: true,
        hasAccess: true,
        companies: existingLinks.map((link) => {
          const company = companiesMap.get(link.companyId);
          return {
            id: link.companyId,
            name: company?.name || "Empresa",
            joinedAt: link.joinedAt,
            role: link.role,
          };
        }),
      });
    }

    // Verificar se está em alguma lista de pré-autorizados (por email ou telefone)
    const dbUser = await db.collection<User>("users").findOne({
      _id: { $in: [user.userId].map((id) => {
        try {
          const { ObjectId } = require("mongodb");
          return new ObjectId(id);
        } catch {
          return id;
        }
      }) },
    });

    if (dbUser) {
      const identifiers = [
        dbUser.email?.toLowerCase(),
        dbUser.phone?.replace(/\D/g, ""),
      ].filter((id): id is string => Boolean(id));

      const preAuthorized = await db
        .collection<AuthorizedClient>("authorized_clients")
        .findOne({
          identifier: { $in: identifiers },
          claimedBy: { $exists: false },
        });

      if (preAuthorized) {
        // Auto-vincular cliente à empresa
        const newLink: Omit<CompanyClient, "_id"> = {
          userId: user.userId,
          companyId: preAuthorized.companyId,
          joinedVia: "pre_authorized",
          status: "active",
          role: "client",
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection<CompanyClient>("company_clients").insertOne(newLink);

        // Marcar como reivindicado
        await db.collection<AuthorizedClient>("authorized_clients").updateOne(
          { _id: preAuthorized._id },
          {
            $set: {
              claimedBy: user.userId,
              claimedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        );

        // Buscar nome da empresa
        const company = await db.collection<User>("users").findOne({
          _id: { $in: [preAuthorized.companyId].map((id) => {
            try {
              const { ObjectId } = require("mongodb");
              return new ObjectId(id);
            } catch {
              return id;
            }
          }) },
        });

        return NextResponse.json({
          success: true,
          hasAccess: true,
          autoLinked: true,
          companies: [
            {
              id: preAuthorized.companyId,
              name: company?.name || "Empresa",
              joinedAt: new Date(),
            },
          ],
        });
      }
    }

    // Cliente não tem acesso, precisa de código
    return NextResponse.json({
      success: true,
      hasAccess: false,
      needsInviteCode: true,
      message: "Você precisa de um código de convite para acessar a plataforma",
    });
  } catch (error) {
    console.error("Error verifying access:", error);
    return NextResponse.json(
      { error: "Failed to verify access" },
      { status: 500 }
    );
  }
}

// POST /api/company/verify-access - Verificar se código é válido (sem autenticação)
// Usado na tela de cadastro para validar o código antes de criar conta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const invite = await db.collection<CompanyInvite>("company_invites").findOne({
      code: inviteCode.toUpperCase(),
      isActive: true,
    });

    if (!invite) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "Código de convite inválido",
      });
    }

    // Verificar expiração
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "Código de convite expirado",
      });
    }

    // Verificar limite de usos
    if (invite.maxUses && invite.currentUses >= invite.maxUses) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "Código de convite atingiu o limite de usos",
      });
    }

    // Buscar nome da empresa
    const { ObjectId } = await import("mongodb");
    const company = await db.collection<User>("users").findOne({
      _id: new ObjectId(invite.companyId),
    });

    return NextResponse.json({
      success: true,
      valid: true,
      company: {
        name: company?.name || "Empresa",
      },
    });
  } catch (error) {
    console.error("Error verifying invite code:", error);
    return NextResponse.json(
      { error: "Failed to verify invite code" },
      { status: 500 }
    );
  }
}

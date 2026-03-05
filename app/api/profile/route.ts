import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { requireAuthFromCookie, requireAuth } from "@/lib/auth/middleware";
import type { CompanyClient } from "@/lib/db/schemas";

// Helper to get auth from either cookie or Bearer token
async function getAuthUser(request: NextRequest) {
  // First try Bearer token
  const bearerAuth = requireAuth(request);
  if (bearerAuth.user) {
    return { user: bearerAuth.user, error: null };
  }

  // Fall back to cookie
  return await requireAuthFromCookie();
}

// GET - Fetch current user profile
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const dbUser = await db.collection("users").findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
    );

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: dbUser._id.toString(),
      email: dbUser.email,
      name: dbUser.name,
      firstName: dbUser.firstName || dbUser.name?.split(" ")[0] || "",
      lastName: dbUser.lastName || dbUser.name?.split(" ").slice(1).join(" ") || "",
      phone: dbUser.phone || "",
      avatar: dbUser.avatar || null,
      role: dbUser.role,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { firstName, lastName, phone, avatar, currentPassword, newPassword } = body;

    const db = await getDatabase();
    const dbUser = await db.collection("users").findOne({
      _id: new ObjectId(user.userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (firstName !== undefined) {
      updateData.firstName = firstName.trim();
      updateData.name = `${firstName.trim()} ${lastName?.trim() || dbUser.lastName || ""}`.trim();
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName.trim();
      updateData.name = `${firstName?.trim() || dbUser.firstName || ""} ${lastName.trim()}`.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    // Handle password change
    if (currentPassword && newPassword) {
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, dbUser.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Update user
    await db.collection("users").updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: updateData }
    );

    // Fetch updated user
    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?._id.toString(),
        email: updatedUser?.email,
        name: updatedUser?.name,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        phone: updatedUser?.phone,
        avatar: updatedUser?.avatar,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// DELETE - Delete current user account
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { password, confirmText } = body;

    // Requer confirmacao - aceita em ingles ou portugues
    const validConfirmTexts = ["DELETE MY ACCOUNT", "EXCLUIR MINHA CONTA"];
    if (!validConfirmTexts.includes(confirmText)) {
      return NextResponse.json(
        { error: "Please type 'DELETE MY ACCOUNT' to confirm" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Buscar usuario para verificar senha
    const dbUser = await db.collection("users").findOne({
      _id: new ObjectId(user.userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verificar senha (se o usuario tem senha - pode ser login social)
    if (dbUser.password && password) {
      const isValidPassword = await bcrypt.compare(password, dbUser.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 400 }
        );
      }
    }

    // Deletar dados relacionados do usuario
    const userId = user.userId;

    // 1. Remover tokens de refresh
    await db.collection("refresh_tokens").deleteMany({ userId });

    // 2. Remover vinculos com empresas
    await db.collection<CompanyClient>("company_clients").deleteMany({ userId });

    // 3. Se for cliente, remover da lista de clientes autorizados
    await db.collection("authorized_clients").updateMany(
      { claimedBy: userId },
      { $unset: { claimedBy: "", claimedAt: "" } }
    );

    // 4. Anonimizar bookings (manter historico mas sem dados pessoais)
    await db.collection("bookings").updateMany(
      { clientId: userId },
      {
        $set: {
          clientName: "[Deleted Account]",
          clientEmail: null,
        },
      }
    );

    // 5. Deletar conversas
    await db.collection("conversations").deleteMany({ clientId: userId });

    // 6. Anonimizar tickets de suporte
    await db.collection("support_tickets").updateMany(
      { clientId: userId },
      {
        $set: {
          clientName: "[Deleted Account]",
          clientEmail: null,
        },
      }
    );

    // 7. Anonimizar reviews
    await db.collection("reviews").updateMany(
      { clientId: userId },
      {
        $set: {
          clientName: "[Deleted Account]",
        },
      }
    );

    // 8. Deletar usuario
    await db.collection("users").deleteOne({
      _id: new ObjectId(userId),
    });

    // 9. Deletar dados de cliente se existir
    if (dbUser.clientId) {
      await db.collection("clients").deleteOne({
        _id: new ObjectId(dbUser.clientId),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Your account has been successfully deleted",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { uploadFromBase64, uploadProfilePhoto, uploadLogo, deleteUpload } from "@/lib/upload";
import { requireAuthFromCookie, requireAuth } from "@/lib/auth/middleware";

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

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { type, data, filename, folder } = body;

    if (!data || !type) {
      return NextResponse.json(
        { error: "Missing required fields: type and data" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "profile":
        result = await uploadProfilePhoto(data, user.userId);
        break;
      case "logo":
        if (!body.establishmentId) {
          return NextResponse.json(
            { error: "Establishment ID required for logo upload" },
            { status: 400 }
          );
        }
        result = await uploadLogo(data, body.establishmentId);
        break;
      case "image":
        result = await uploadFromBase64(data, filename || "image.jpg", {
          folder: folder || "images",
          maxSize: 2 * 1024 * 1024,
          allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        });
        break;
      case "document":
        result = await uploadFromBase64(data, filename || "document.pdf", {
          folder: folder || "documents",
          maxSize: 5 * 1024 * 1024,
          allowedTypes: ["application/pdf", "text/csv", "application/vnd.ms-excel"],
        });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid upload type" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteUpload(url);

    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error("Delete upload error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}

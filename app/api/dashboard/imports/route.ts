import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

// GET - Fetch import history
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuthFromCookie();
    if (error) return error;

    const db = await getDatabase();

    // Get import logs
    const imports = await db.collection("importLogs")
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    // Format import history
    const formattedImports = imports.map((imp) => ({
      id: imp._id?.toString() || "",
      name: imp.fileName || "import.csv",
      size: imp.fileSize || "Unknown",
      dateUploaded: imp.createdAt
        ? new Date(imp.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "N/A",
      lastUpdated: imp.updatedAt
        ? new Date(imp.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "N/A",
      recordCount: imp.recordCount || imp.results?.success || 0,
      uploadedBy: {
        name: imp.uploadedBy?.name || "Unknown",
        email: imp.uploadedBy?.email || "",
        initials: imp.uploadedBy?.name
          ? imp.uploadedBy.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
          : "??",
      },
    }));

    return NextResponse.json({
      files: formattedImports,
    });
  } catch (error) {
    console.error("Import history API error:", error);
    return NextResponse.json(
      { error: "Failed to load import history" },
      { status: 500 }
    );
  }
}

// POST - Log a new import
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { fileName, fileSize, recordCount, results } = body;

    const db = await getDatabase();
    const now = new Date();

    // Get user info
    const staff = await db.collection("staff").findOne({ email: user.email });

    const importLog = {
      fileName,
      fileSize,
      recordCount,
      results,
      uploadedBy: {
        userId: user.userId,
        email: user.email,
        name: staff?.name || user.email.split("@")[0],
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("importLogs").insertOne(importLog);

    return NextResponse.json({
      success: true,
      importId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Log import error:", error);
    return NextResponse.json(
      { error: "Failed to log import" },
      { status: 500 }
    );
  }
}

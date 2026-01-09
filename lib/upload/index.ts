// File upload service - supports local storage and can be extended to S3/Cloudinary
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  filename?: string;
}

export interface UploadOptions {
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB default
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "text/csv", "application/vnd.ms-excel"];

// Ensure upload directory exists
async function ensureUploadDir(folder: string = ""): Promise<string> {
  const dir = path.join(UPLOAD_DIR, folder);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
}

// Upload file from base64
export async function uploadFromBase64(
  base64Data: string,
  filename: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const { folder = "", maxSize = MAX_FILE_SIZE } = options;

    // Extract mime type and data
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return { success: false, error: "Invalid base64 format" };
    }

    const mimeType = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, "base64");

    // Check file size
    if (buffer.length > maxSize) {
      return { success: false, error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` };
    }

    // Check allowed types
    const allowedTypes = options.allowedTypes || [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
    if (!allowedTypes.includes(mimeType)) {
      return { success: false, error: `File type ${mimeType} not allowed` };
    }

    // Generate unique filename and save
    const dir = await ensureUploadDir(folder);
    const newFilename = generateFilename(filename);
    const filePath = path.join(dir, newFilename);

    await writeFile(filePath, buffer);

    const url = `/uploads/${folder ? folder + "/" : ""}${newFilename}`;

    return { success: true, url, filename: newFilename };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

// Upload file from FormData
export async function uploadFromFormData(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const { folder = "", maxSize = MAX_FILE_SIZE } = options;

    // Check file size
    if (file.size > maxSize) {
      return { success: false, error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` };
    }

    // Check allowed types
    const allowedTypes = options.allowedTypes || [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: `File type ${file.type} not allowed` };
    }

    // Convert to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dir = await ensureUploadDir(folder);
    const newFilename = generateFilename(file.name);
    const filePath = path.join(dir, newFilename);

    await writeFile(filePath, buffer);

    const url = `/uploads/${folder ? folder + "/" : ""}${newFilename}`;

    return { success: true, url, filename: newFilename };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

// Delete uploaded file
export async function deleteUpload(url: string): Promise<boolean> {
  try {
    if (!url.startsWith("/uploads/")) {
      return false;
    }

    const filePath = path.join(process.cwd(), "public", url);
    if (existsSync(filePath)) {
      await unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

// Image-specific upload
export async function uploadImage(
  base64Data: string,
  filename: string,
  folder: string = "images"
): Promise<UploadResult> {
  return uploadFromBase64(base64Data, filename, {
    folder,
    maxSize: 2 * 1024 * 1024, // 2MB for images
    allowedTypes: ALLOWED_IMAGE_TYPES,
  });
}

// Profile photo upload
export async function uploadProfilePhoto(
  base64Data: string,
  userId: string
): Promise<UploadResult> {
  return uploadFromBase64(base64Data, `${userId}.jpg`, {
    folder: "profiles",
    maxSize: 2 * 1024 * 1024,
    allowedTypes: ALLOWED_IMAGE_TYPES,
  });
}

// Logo upload
export async function uploadLogo(
  base64Data: string,
  establishmentId: string
): Promise<UploadResult> {
  return uploadFromBase64(base64Data, `${establishmentId}-logo.png`, {
    folder: "logos",
    maxSize: 2 * 1024 * 1024,
    allowedTypes: ALLOWED_IMAGE_TYPES,
  });
}

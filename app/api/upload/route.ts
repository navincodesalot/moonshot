import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { uploadFile } from "@/lib/vss-client";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const supervisorNotes = (formData.get("supervisorNotes") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: mp4, mov, avi, webm` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 500 MB.` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const vssResponse = await uploadFile(buffer, file.name);

    const db = await connectDB();
    const now = new Date();
    const { insertedId } = await db.collection("reports").insertOne({
      status: "uploaded",
      vssFileId: vssResponse.id,
      videoFilename: file.name,
      supervisorNotes,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      reportId: insertedId.toString(),
      fileId: vssResponse.id,
    });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

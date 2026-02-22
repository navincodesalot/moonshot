import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { connectDB } from "@/lib/mongodb";
import { uploadFile } from "@/lib/vss-client";

const f = createUploadthing();

export const ourFileRouter = {
    videoUploader: f({
        video: {
            maxFileSize: "512MB",
            maxFileCount: 1,
            acl: "public-read",
        },
    })
        .middleware(async ({ req, files }) => {
            // This runs on the server before the file is uploaded
            const file = files[0];
            if (!file) throw new UploadThingError("No file provided");

            return { filename: file.name, fileSize: file.size };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            const videoUrl = file.ufsUrl || file.url;

            const res = await fetch(videoUrl);
            if (!res.ok) {
                throw new UploadThingError(
                    `Failed to download file from UploadThing (${res.status})`,
                );
            }
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const vssResponse = await uploadFile(buffer, metadata.filename);

            const db = await connectDB();
            const now = new Date();
            const { insertedId } = await db.collection("reports").insertOne({
                status: "uploaded",
                vssFileId: vssResponse.id,
                videoFilename: metadata.filename,
                uploadthingUrl: videoUrl,
                uploadthingKey: file.key,
                supervisorNotes: "",
                createdAt: now,
                updatedAt: now,
            });

            return {
                reportId: insertedId.toString(),
                fileId: vssResponse.id,
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

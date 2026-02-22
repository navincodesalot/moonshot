import type { ObjectId } from "mongodb";

export type ReportStatus =
  | "uploading"
  | "uploaded"
  | "analyzing"
  | "processing"
  | "complete"
  | "error";

export interface Report {
  _id: ObjectId;
  status: ReportStatus;
  vssFileId: string;
  videoFilename: string;
  uploadthingUrl?: string;
  uploadthingKey?: string;
  supervisorNotes?: string;
  rawVSSOutput?: string;
  structuredReport?: Record<string, unknown>;
  processingTimeMs?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportInsert {
  status: ReportStatus;
  vssFileId: string;
  videoFilename: string;
  uploadthingUrl?: string;
  uploadthingKey?: string;
  supervisorNotes?: string;
  rawVSSOutput?: string;
  structuredReport?: Record<string, unknown>;
  processingTimeMs?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileVideo } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
const MAX_SIZE = 500 * 1024 * 1024;

interface VideoUploadFormProps {
  onUploadComplete: (data: { reportId: string; fileId: string; blobUrl?: string }) => void;
  onUploadProgress?: (progress: number) => void;
  onFileSelected?: (file: File, blobUrl: string) => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
}

export function VideoUploadForm({
  onUploadComplete,
  onUploadProgress,
  onFileSelected,
  isUploading,
  setIsUploading,
}: VideoUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("videoUploader", {
    onUploadProgress: (p) => {
      setProgress(p);
      onUploadProgress?.(p);
    },
    onClientUploadComplete: (res) => {
      if (!res?.[0]?.serverData) {
        setError("Upload succeeded but no server response received.");
        setIsUploading(false);
        return;
      }
      const { reportId, fileId } = res[0].serverData;
      onUploadComplete({ reportId, fileId, blobUrl: blobUrl ?? undefined });
    },
    onUploadError: (err) => {
      setError(err.message || "Upload failed");
      setIsUploading(false);
      setProgress(0);
    },
  });

  const validateFile = useCallback((f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return "Invalid file type. Please upload an MP4, MOV, AVI, or WebM video.";
    }
    if (f.size > MAX_SIZE) {
      return "File is too large. Maximum size is 500 MB.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setFile(f);
      const url = URL.createObjectURL(f);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      onFileSelected?.(f, url);
    },
    [validateFile, onFileSelected],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const onSubmit = async () => {
    if (!file) {
      setError("Please select a video file.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    await startUpload([file]);
  };

  return (
    <Card className="w-full max-w-lg mx-auto min-w-0">
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
        <CardDescription>
          Upload a workplace video for AI-powered safety analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isUploading ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-8">
            <FileVideo className="size-8 text-primary animate-pulse" />
            <div className="text-sm font-medium">
              Uploading {file?.name}...
            </div>
            <div className="w-full max-w-xs flex flex-col gap-1.5">
              <Progress value={progress} className="h-2" indicatorColor="var(--primary)" />
              <div className="text-xs text-muted-foreground text-center tabular-nums">
                {progress}%
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : file
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="hidden"
              />

              {file ? (
                <>
                  <FileVideo className="size-8 text-primary" />
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (blobUrl) URL.revokeObjectURL(blobUrl);
                      setBlobUrl(null);
                      setFile(null);
                    }}
                  >
                    <X className="size-3" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    Drag & drop a video, or click to browse
                  </div>
                  <div className="text-xs text-muted-foreground">
                    MP4, MOV, AVI, or WebM up to 500 MB
                  </div>
                </>
              )}
            </div>

            <Button size="lg" disabled={!file} onClick={onSubmit}>
              Upload & Analyze
            </Button>
          </>
        )}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

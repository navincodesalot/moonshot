"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, X, FileVideo } from "lucide-react";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
const MAX_SIZE = 500 * 1024 * 1024;

interface VideoUploadFormProps {
  onUploadComplete: (data: { reportId: string; fileId: string }) => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
}

export function VideoUploadForm({
  onUploadComplete,
  isUploading,
  setIsUploading,
}: VideoUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    },
    [validateFile],
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a video file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onUploadComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
        <CardDescription>
          Upload a workplace video for AI-powered safety analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" size="lg" disabled={!file || isUploading}>
            {isUploading ? "Uploading..." : "Upload & Analyze"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

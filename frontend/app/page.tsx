"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VideoUploadForm } from "@/components/video-upload-form";
import { AnalysisProgress } from "@/components/analysis-progress";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileText } from "lucide-react";
import Link from "next/link";

type PipelineState =
  | { phase: "idle" }
  | { phase: "uploading" }
  | { phase: "finalizing"; filename: string }
  | { phase: "analyzing"; reportId: string; filename: string; status: string }
  | { phase: "complete"; reportId: string }
  | { phase: "error"; message: string };

export default function Page() {
  const router = useRouter();
  const [state, setState] = useState<PipelineState>({ phase: "idle" });
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const handleFileSelected = useCallback((_file: File, url: string) => {
    setBlobUrl(url);
  }, []);

  const handleUploadProgress = useCallback((progress: number) => {
    if (progress >= 100) {
      setState((prev) =>
        prev.phase === "uploading"
          ? { phase: "finalizing", filename: "" }
          : prev
      );
    }
  }, []);

  const handleUploadComplete = useCallback(
    async (data: { reportId: string; fileId: string; blobUrl?: string }) => {
      const urlToStore = data.blobUrl ?? blobUrl;
      if (urlToStore) {
        try {
          sessionStorage.setItem(`video-preview-${data.reportId}`, urlToStore);
        } catch { /* ignore */ }
      }

      setState((prev) => ({
        phase: "analyzing",
        reportId: data.reportId,
        filename: prev.phase === "finalizing" ? prev.filename : "",
        status: "uploaded",
      }));

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: data.reportId }),
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Analysis failed");
        }

        setState({ phase: "complete", reportId: data.reportId });
      } catch (err) {
        setState({
          phase: "error",
          message: err instanceof Error ? err.message : "Analysis failed",
        });
      }
    },
    [blobUrl],
  );

  // Poll for status while analyzing
  useEffect(() => {
    if (state.phase !== "analyzing") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/reports/${state.reportId}`);
        const data = await res.json();
        if (data.status === "complete") {
          setState({ phase: "complete", reportId: state.reportId });
        } else if (data.status === "error") {
          setState({ phase: "error", message: data.errorMessage || "Analysis failed" });
        } else {
          setState((prev) =>
            prev.phase === "analyzing"
              ? { ...prev, status: data.status, filename: data.videoFilename || prev.filename }
              : prev,
          );
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [state]);

  // Auto-redirect on complete
  useEffect(() => {
    if (state.phase === "complete") {
      const timer = setTimeout(() => {
        router.push(`/reports/${state.reportId}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <h1 className="text-sm font-semibold tracking-tight">Moonshot</h1>
        <div className="flex items-center gap-2">
          <Link href="/reports">
            <Button variant="outline" size="sm">
              <FileText className="size-3" />
              View Reports
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {(state.phase === "idle" || state.phase === "uploading") && (
          <VideoUploadForm
            onUploadComplete={handleUploadComplete}
            onUploadProgress={handleUploadProgress}
            onFileSelected={handleFileSelected}
            isUploading={state.phase === "uploading"}
            setIsUploading={(v) =>
              setState(v ? { phase: "uploading" } : { phase: "idle" })
            }
          />
        )}

        {(state.phase === "finalizing" || state.phase === "analyzing") && (
          <AnalysisProgress
            status={state.phase === "finalizing" ? "finalizing" : state.status}
            videoFilename={state.filename || "Video"}
          />
        )}

        {state.phase === "complete" && (
          <div className="text-center flex flex-col items-center gap-3">
            <div className="size-3 rounded-full bg-primary animate-pulse" />
            <p className="text-sm text-muted-foreground">
              Analysis complete. Redirecting to report...
            </p>
          </div>
        )}

        {state.phase === "error" && (
          <div className="text-center flex flex-col items-center gap-4 max-w-md">
            <p className="text-sm text-destructive">{state.message}</p>
            <Button onClick={() => setState({ phase: "idle" })} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReportView, ScoreCards } from "@/components/report-view";
import { AnalysisProgress } from "@/components/analysis-progress";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { StructuredReport } from "@/lib/schemas/report-schema";

interface ReportData {
  _id: string;
  status: string;
  vssFileId: string;
  videoFilename: string;
  uploadthingUrl?: string;
  supervisorNotes?: string;
  rawVSSOutput?: string;
  structuredReport?: Record<string, unknown>;
  processingTimeMs?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(`video-preview-${params.id}`);
      if (cached) setLocalVideoUrl(cached);
    } catch { /* ignore */ }
  }, [params.id]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${params.id}`);
        if (!res.ok) {
          router.push("/reports");
          return;
        }
        const data = await res.json();
        setReport(data);
      } catch {
        router.push("/reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();

    // Poll if not complete
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/reports/${params.id}`);
        const data = await res.json();
        setReport(data);
        if (data.status === "complete" || data.status === "error") {
          clearInterval(interval);
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (!report) return null;

  const isProcessing = !["complete", "error"].includes(report.status);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
        <Link href="/reports" className="shrink-0">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">{report.videoFilename}</h1>
          <StatusBadge status={report.status} className="shrink-0" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {new Date(report.createdAt).toLocaleString()}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left panel: video + scores */}
        <div className="lg:w-[35%] lg:min-w-[280px] border-b lg:border-b-0 lg:border-r p-4 flex flex-col gap-4 overflow-y-auto min-h-0">
          {(localVideoUrl || report.uploadthingUrl) ? (
            <video
              src={localVideoUrl || report.uploadthingUrl || undefined}
              controls
              className="w-full rounded-lg aspect-video bg-black shrink-0"
            />
          ) : (
            <div className="rounded-lg bg-muted aspect-video flex items-center justify-center shrink-0">
              <p className="text-xs text-muted-foreground">
                No video available for {report.videoFilename}
              </p>
            </div>
          )}

          {report.status === "complete" && report.structuredReport && (
            <ScoreCards report={report.structuredReport as StructuredReport} />
          )}
        </div>

        {/* Right panel: status-dependent content */}
        <div className="lg:w-[65%] lg:min-w-0 p-4 overflow-y-auto min-h-0 flex-1">
          {isProcessing ? (
            <div className="h-full flex items-center justify-center">
              <AnalysisProgress status={report.status} videoFilename={report.videoFilename} />
            </div>
          ) : report.status === "error" ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center flex flex-col items-center gap-3">
                <StatusBadge status="error" />
                <p className="text-sm text-destructive">
                  {report.errorMessage || "An error occurred during analysis."}
                </p>
                <Link href="/">
                  <Button variant="outline">Upload New Video</Button>
                </Link>
              </div>
            </div>
          ) : report.structuredReport ? (
            <ReportView
              report={report.structuredReport as StructuredReport}
              rawOutput={report.rawVSSOutput}
              processingTimeMs={report.processingTimeMs}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No structured report available.</p>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReportView } from "@/components/report-view";
import { AnalysisProgress } from "@/components/analysis-progress";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ReportData {
  _id: string;
  status: string;
  vssFileId: string;
  videoFilename: string;
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
      <header className="border-b px-6 py-3 flex items-center gap-3">
        <Link href="/reports">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <h1 className="text-sm font-semibold truncate">{report.videoFilename}</h1>
          <StatusBadge status={report.status} />
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(report.createdAt).toLocaleString()}
        </span>
      </header>

      {isProcessing ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <AnalysisProgress status={report.status} videoFilename={report.videoFilename} />
        </main>
      ) : report.status === "error" ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center flex flex-col items-center gap-3">
            <StatusBadge status="error" />
            <p className="text-sm text-destructive">
              {report.errorMessage || "An error occurred during analysis."}
            </p>
            <Link href="/">
              <Button variant="outline">Upload New Video</Button>
            </Link>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col lg:flex-row">
          {/* Left panel: video + notes */}
          <div className="lg:w-[35%] border-b lg:border-b-0 lg:border-r p-4">
            <div className="rounded-lg bg-muted aspect-video flex items-center justify-center">
              <p className="text-xs text-muted-foreground">
                Video preview for {report.videoFilename}
              </p>
            </div>
          </div>

          {/* Right panel: report */}
          <div className="lg:w-[65%] p-4 overflow-y-auto">
            {report.structuredReport ? (
              <ReportView
                report={report.structuredReport as import("@/lib/schemas/report-schema").StructuredReport}
                rawOutput={report.rawVSSOutput}
                processingTimeMs={report.processingTimeMs}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No structured report available.</p>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

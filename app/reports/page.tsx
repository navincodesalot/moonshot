"use client";

import { useEffect, useState, useCallback } from "react";
import { ReportCard } from "@/components/report-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface ReportSummary {
  _id: string;
  status: string;
  videoFilename: string;
  processingTimeMs?: number;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/reports/${id}`, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-tight">Reports</h1>
        <Link href="/">
          <Button size="sm">
            <Plus className="size-3" />
            New Upload
          </Button>
        </Link>
      </header>

      <main className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm text-muted-foreground">No reports yet.</p>
            <Link href="/">
              <Button variant="outline">
                <Plus className="size-3" />
                Upload a Video
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ArrowRight, Trash2 } from "lucide-react";

interface ReportCardProps {
  report: {
    _id: string;
    status: string;
    videoFilename: string;
    processingTimeMs?: number;
    createdAt: string;
  };
  onDelete?: (id: string) => void;
}

export function ReportCard({ report, onDelete }: ReportCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">{report.videoFilename}</CardTitle>
        <CardAction>
          <StatusBadge status={report.status} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              {new Date(report.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {report.processingTimeMs != null && (
              <span className="text-xs text-muted-foreground">
                Processed in {(report.processingTimeMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(report._id);
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            )}
            <Link href={`/reports/${report._id}`}>
              <Button variant="outline" size="sm">
                View
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

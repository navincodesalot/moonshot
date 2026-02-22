"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Users,
  Activity,
  Clock,
  FileText,
} from "lucide-react";
import type { StructuredReport } from "@/lib/schemas/report-schema";

const SEVERITY_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  low: "secondary",
  medium: "outline",
  high: "destructive",
  critical: "destructive",
};

interface ReportViewProps {
  report: StructuredReport;
  rawOutput?: string;
  processingTimeMs?: number;
}

export function ReportView({ report, rawOutput, processingTimeMs }: ReportViewProps) {
  const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(new Set());
  const [showRaw, setShowRaw] = useState(false);

  const toggleWorker = (id: string) => {
    setExpandedWorkers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{report.summary}</p>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 pt-3">
            <Users className="size-4 text-muted-foreground" />
            <div className="text-lg font-semibold">{report.metrics.totalWorkers}</div>
            <div className="text-xs text-muted-foreground">Workers</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 pt-3">
            <Activity className="size-4 text-muted-foreground" />
            <div className="text-lg font-semibold">{report.metrics.totalActions}</div>
            <div className="text-xs text-muted-foreground">Actions</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 pt-3">
            <Clock className="size-4 text-muted-foreground" />
            <div className="text-lg font-semibold">{report.metrics.videoDuration}</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 pt-3">
            <AlertTriangle className="size-4 text-muted-foreground" />
            <div className="text-lg font-semibold">{report.hazards?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">Hazards</div>
          </CardContent>
        </Card>
      </div>

      {/* Key Findings */}
      {report.metrics.keyFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5">
              {report.metrics.keyFindings.map((finding, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0 mt-0.5">&#x2022;</span>
                  {finding}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Workers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Workers ({report.workers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {report.workers.map((worker) => {
            const isExpanded = expandedWorkers.has(worker.id);
            return (
              <div key={worker.id} className="rounded-md border">
                <button
                  onClick={() => toggleWorker(worker.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="size-3.5 shrink-0" />
                  )}
                  <span className="text-sm font-medium">{worker.id}</span>
                  <span className="text-xs text-muted-foreground">{worker.description}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {worker.actions.length} actions
                  </Badge>
                </button>

                {isExpanded && (
                  <div className="border-t px-3 py-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left py-1 font-medium">Action</th>
                          <th className="text-left py-1 font-medium">Start</th>
                          <th className="text-left py-1 font-medium">End</th>
                          <th className="text-left py-1 font-medium">Duration</th>
                          <th className="text-left py-1 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {worker.actions.map((action, i) => (
                          <tr key={i} className="border-t border-dashed">
                            <td className="py-1.5">{action.action}</td>
                            <td className="py-1.5 text-muted-foreground">{action.startTime}</td>
                            <td className="py-1.5 text-muted-foreground">{action.endTime}</td>
                            <td className="py-1.5 text-muted-foreground">{action.duration}</td>
                            <td className="py-1.5 text-muted-foreground">{action.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Hazards */}
      {report.hazards && report.hazards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Hazards
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {report.hazards.map((hazard, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border p-3">
                <Badge variant={SEVERITY_VARIANT[hazard.severity] ?? "outline"}>
                  {hazard.severity}
                </Badge>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{hazard.description}</span>
                  <span className="text-xs text-muted-foreground">at {hazard.timestamp}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Processing Info */}
      {processingTimeMs != null && (
        <p className="text-xs text-muted-foreground text-right">
          Processed in {(processingTimeMs / 1000).toFixed(1)}s
        </p>
      )}

      {/* Raw Output */}
      {rawOutput && (
        <>
          <Separator />
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
              className="mb-2"
            >
              {showRaw ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Raw VSS Output
            </Button>
            {showRaw && (
              <Card>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground max-h-96 overflow-auto">
                    {rawOutput}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

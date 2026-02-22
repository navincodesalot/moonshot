"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Loader2 } from "lucide-react";

interface AnalysisProgressProps {
  status: string;
  videoFilename: string;
}

const STEP_ORDER = ["uploaded", "analyzing", "processing", "complete"];
const STEP_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];
const STEP_LABELS: Record<string, string> = {
  uploaded: "Video uploaded",
  finalizing: "Finalizing upload",
  analyzing: "Running AI video analysis",
  processing: "Formatting report with Gemini",
  complete: "Report ready",
};

export function AnalysisProgress({ status, videoFilename }: AnalysisProgressProps) {
  const displayStatus = status === "finalizing" ? "analyzing" : status;
  const currentIdx = displayStatus === "complete" ? 4 : STEP_ORDER.indexOf(displayStatus);

  return (
    <Card className="w-full max-w-lg mx-auto min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status !== "complete" && status !== "error" && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Processing: {videoFilename}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {STEP_ORDER.map((step, idx) => {
            const isActive = (step === "analyzing" && status === "finalizing") || step === displayStatus;
            const isDone = idx < currentIdx || status === "complete";
            const label = step === "analyzing" && status === "finalizing"
              ? STEP_LABELS.finalizing
              : STEP_LABELS[step];
            const circleColor = isDone || isActive ? STEP_COLORS[idx] : undefined;

            return (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={`size-2.5 rounded-full shrink-0 ${
                    isDone || isActive ? "" : "bg-muted"
                  } ${isActive ? "animate-pulse" : ""}`}
                  style={circleColor ? { backgroundColor: circleColor } : undefined}
                />
                <span
                  className={`text-sm ${
                    isDone || isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {isActive && <StatusBadge status={status === "finalizing" ? "uploaded" : status} />}
              </div>
            );
          })}

          {status === "error" && (
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status="error" />
              <span className="text-sm text-destructive">
                An error occurred during processing.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Loader2 } from "lucide-react";

interface AnalysisProgressProps {
  status: string;
  videoFilename: string;
}

const STEP_ORDER = ["uploaded", "analyzing", "processing", "complete"];

export function AnalysisProgress({ status, videoFilename }: AnalysisProgressProps) {
  const currentIdx = STEP_ORDER.indexOf(status);

  return (
    <Card className="w-full max-w-lg mx-auto">
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
            const isActive = step === status;
            const isDone = idx < currentIdx || status === "complete";

            return (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={`size-2.5 rounded-full shrink-0 ${
                    isDone
                      ? "bg-primary"
                      : isActive
                        ? "bg-primary animate-pulse"
                        : "bg-muted"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isDone || isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step === "uploaded" && "Video uploaded"}
                  {step === "analyzing" && "Running AI video analysis"}
                  {step === "processing" && "Formatting report with Gemini"}
                  {step === "complete" && "Report ready"}
                </span>
                {isActive && <StatusBadge status={status} />}
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

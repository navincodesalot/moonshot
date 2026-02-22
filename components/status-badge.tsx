"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  uploading: { label: "Uploading", variant: "outline" },
  uploaded: { label: "Uploaded", variant: "secondary" },
  analyzing: { label: "Analyzing", variant: "outline" },
  processing: { label: "Processing", variant: "outline" },
  complete: { label: "Complete", variant: "default" },
  error: { label: "Error", variant: "destructive" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const };

  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}

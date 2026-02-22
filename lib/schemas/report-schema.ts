import { z } from "zod";

export const actionSchema = z.object({
  action: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.string(),
  notes: z.string().optional(),
});

export const workerSchema = z.object({
  id: z.string(),
  description: z.string(),
  actions: z.array(actionSchema),
});

export const hazardSchema = z.object({
  description: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  timestamp: z.string(),
});

export const metricsSchema = z.object({
  totalWorkers: z.number(),
  totalActions: z.number(),
  videoDuration: z.string(),
  keyFindings: z.array(z.string()),
});

export const structuredReportSchema = z.object({
  summary: z.string(),
  workers: z.array(workerSchema),
  hazards: z.array(hazardSchema).optional(),
  metrics: metricsSchema,
});

export type StructuredReport = z.infer<typeof structuredReportSchema>;
export type Worker = z.infer<typeof workerSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Hazard = z.infer<typeof hazardSchema>;
export type Metrics = z.infer<typeof metricsSchema>;

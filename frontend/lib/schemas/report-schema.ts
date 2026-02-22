import { z } from "zod";

export const pieSliceSchema = z.object({
  name: z.string(),
  value: z.number(),
  seconds: z.number(),
});

export const timelineEventSchema = z.object({
  category: z.string(),
  start: z.number(),
  end: z.number(),
  task: z.string(),
});

export const metadataSchema = z.object({
  Work_Description: z.string(),
  Stream_Duration_Sec: z.number(),
  Gen_Summary: z.array(z.string()),
});

export const scoresSchema = z.object({
  Prod_Score: z.union([z.string(), z.number()]),
  Qual_Score: z.union([z.string(), z.number()]),
  Safe_Score: z.union([z.string(), z.number()]),
});

export const descriptionsSchema = z.object({
  Prod_Desc: z.string(),
  Qual_Desc: z.string(),
  Safe_Desc: z.string(),
});

export const structuredReportSchema = z.object({
  Metadata: metadataSchema,
  Recharts_Pie: z.array(pieSliceSchema),
  Recharts_Timeline: z.array(timelineEventSchema),
  Scores: scoresSchema,
  Descriptions: descriptionsSchema,
});

export type StructuredReport = z.infer<typeof structuredReportSchema>;
export type PieSlice = z.infer<typeof pieSliceSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

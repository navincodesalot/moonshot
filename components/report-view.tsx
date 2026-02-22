"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ChevronDown,
  ChevronRight,
  Zap,
  ShieldCheck,
  Target,
  Clock,
  Wrench,
  FileText,
} from "lucide-react";
import type { StructuredReport } from "@/lib/schemas/report-schema";

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const PIE_CONFIG: ChartConfig = {
  "Direct Work": { label: "Direct Work", color: PIE_COLORS[0] },
  "Tool & Material Handling": { label: "Tool & Material", color: PIE_COLORS[1] },
  "Transition & Movement": { label: "Transition", color: PIE_COLORS[2] },
  "Idle & Distraction": { label: "Idle", color: PIE_COLORS[3] },
  "Safety/Quality Adjustment": { label: "Safety/Quality", color: PIE_COLORS[4] },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Direct Work": PIE_COLORS[0],
  "Tool & Material Handling": PIE_COLORS[1],
  "Transition & Movement": PIE_COLORS[2],
  "Idle & Distraction": PIE_COLORS[3],
  "Safety/Quality Adjustment": PIE_COLORS[4],
};

function parseScore(val: string | number): number {
  if (typeof val === "number") return val;
  const match = val.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function scoreColor(score: number): string {
  if (score >= 80) return "var(--primary)";
  if (score >= 60) return "var(--chart-2)";
  return "var(--destructive)";
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface ReportViewProps {
  report: StructuredReport;
  rawOutput?: string;
  processingTimeMs?: number;
}

export function ReportView({ report, rawOutput, processingTimeMs }: ReportViewProps) {
  const [showRaw, setShowRaw] = useState(false);

  const timelineData = report.Recharts_Timeline.map((evt, i) => {
    const label = evt.task.length > 28 ? evt.task.slice(0, 26) + "..." : evt.task;
    return {
      ...evt,
      label,
      range: [evt.start, evt.end] as [number, number],
      fill: CATEGORY_COLORS[evt.category] || "var(--chart-3)",
      idx: i,
    };
  });

  const timelineConfig: ChartConfig = {
    range: { label: "Time (s)" },
  };

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      {/* Work Description + Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <CardTitle className="text-xl sm:text-2xl">{report.Metadata.Work_Description}</CardTitle>
          </div>
          <CardDescription className="flex items-center gap-1.5 text-base">
            <Clock className="size-4" />
            {formatSeconds(report.Metadata.Stream_Duration_Sec)} total duration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-48 overflow-y-auto" aria-label="Summary">
            <ul className="flex flex-col gap-2">
              {report.Metadata.Gen_Summary.map((point, i) => (
                <li key={i} className="text-base sm:text-lg flex items-start gap-2">
                  <span className="text-primary shrink-0 mt-0.5 font-bold">&bull;</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart — Time Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="size-4" />
            Time Distribution
          </CardTitle>
          <CardDescription>Breakdown of how time was spent during the video</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6">
            <ChartContainer config={PIE_CONFIG} className="aspect-square max-h-[240px] sm:max-h-[260px] w-full md:w-1/2 min-h-0">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="name"
                      formatter={(value, name, item) => {
                        const slice = item?.payload;
                        return (
                          <span className="text-foreground">
                            {value}% ({formatSeconds(slice?.seconds ?? 0)})
                          </span>
                        );
                      }}
                    />
                  }
                />
                <Pie
                  data={report.Recharts_Pie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  strokeWidth={2}
                  stroke="var(--background)"
                >
                  {report.Recharts_Pie.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>

            <div className="flex flex-col gap-2 w-full md:w-1/2">
              {report.Recharts_Pie.map((slice, i) => (
                <div key={slice.name} className="flex items-center gap-3">
                  <div
                    className="size-3 rounded-sm shrink-0"
                    style={{ background: CATEGORY_COLORS[slice.name] || PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{slice.name}</span>
                      <span className="font-medium tabular-nums">{slice.value}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${slice.value}%`,
                          background: CATEGORY_COLORS[slice.name] || PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                    {formatSeconds(slice.seconds)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4" />
              Activity Timeline
            </CardTitle>
            <CardDescription>Each bar spans its actual start-to-end time, colored by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={timelineConfig}
              className="w-full"
              style={{ height: Math.max(200, timelineData.length * 36 + 40) }}
            >
              <BarChart
                data={timelineData}
                layout="vertical"
                margin={{ left: 4, right: 12, top: 4, bottom: 20 }}
                barCategoryGap="20%"
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={180}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatSeconds(v)}
                  domain={["dataMin", "dataMax"]}
                  label={{ value: "Time", position: "insideBottom", offset: -10, fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(_value, _name, item) => {
                        const evt = item?.payload;
                        return (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{evt?.task}</span>
                            <span className="text-muted-foreground">
                              {formatSeconds(evt?.start ?? 0)} — {formatSeconds(evt?.end ?? 0)} ({formatSeconds((evt?.end ?? 0) - (evt?.start ?? 0))})
                            </span>
                            <Badge variant="outline" className="w-fit mt-0.5 text-[10px]">
                              {evt?.category}
                            </Badge>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Bar dataKey="range" radius={[0, 4, 4, 0]}>
                  {timelineData.map((entry) => (
                    <Cell key={entry.idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
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
              <FileText className="size-3" />
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

function ScoreCard({
  label,
  score,
  description,
  icon,
  iconColor,
}: {
  label: string;
  score: number;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
}) {
  const color = scoreColor(score);

  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full" style={{ background: color }} />
      <CardContent className="pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-base sm:text-lg font-medium shrink-0">
            <span style={{ color: iconColor }}>{icon}</span>
            {label}
          </div>
          <span className="text-4xl sm:text-5xl font-bold tabular-nums shrink-0" style={{ color }}>
            {score}
          </span>
        </div>
        <Progress
          value={score}
          className="h-2"
          indicatorColor={color}
        />
        <div className="max-h-24 overflow-y-auto" aria-label={`${label} description`}>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScoreCards({ report }: { report: StructuredReport }) {
  const prodScore = parseScore(report.Scores.Prod_Score);
  const qualScore = parseScore(report.Scores.Qual_Score);
  const safeScore = parseScore(report.Scores.Safe_Score);

  return (
    <div className="flex flex-col gap-3">
      <ScoreCard
        label="Productivity"
        score={prodScore}
        description={report.Descriptions.Prod_Desc}
        icon={<Zap className="size-5" />}
        iconColor="var(--chart-1)"
      />
      <ScoreCard
        label="Quality"
        score={qualScore}
        description={report.Descriptions.Qual_Desc}
        icon={<Target className="size-5" />}
        iconColor="var(--chart-2)"
      />
      <ScoreCard
        label="Safety"
        score={safeScore}
        description={report.Descriptions.Safe_Desc}
        icon={<ShieldCheck className="size-5" />}
        iconColor="var(--chart-4)"
      />
    </div>
  );
}

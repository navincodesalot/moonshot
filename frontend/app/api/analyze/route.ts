import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { summarizeVideo } from "@/lib/vss-client";
import { formatWithGemini } from "@/lib/gemini";

const VSS_PROMPT =
  "Describe everything happening in this video in detail. Include all visible workers, their actions, timestamps, equipment used, and any safety-related observations.";

export async function POST(req: NextRequest) {
  let reportId: string | null = null;

  try {
    const body = await req.json();
    reportId = body.reportId;

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    const db = await connectDB();
    const reports = db.collection("reports");

    let report = await reports.findOne({ _id: new ObjectId(reportId) });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const startTime = Date.now();

    await reports.updateOne(
      { _id: new ObjectId(reportId) },
      { $set: { status: "analyzing", updatedAt: new Date() } },
    );

    const vssResult = await summarizeVideo(report.vssFileId, VSS_PROMPT);

    const rawOutput =
      vssResult.choices?.[0]?.message?.content ?? JSON.stringify(vssResult);

    await reports.updateOne(
      { _id: new ObjectId(reportId) },
      {
        $set: {
          rawVSSOutput: rawOutput,
          status: "processing",
          updatedAt: new Date(),
        },
      },
    );

    const structured = await formatWithGemini(rawOutput);

    const processingTimeMs = Date.now() - startTime;
    await reports.updateOne(
      { _id: new ObjectId(reportId) },
      {
        $set: {
          structuredReport: structured,
          status: "complete",
          processingTimeMs,
          updatedAt: new Date(),
        },
      },
    );

    const updated = await reports.findOne({ _id: new ObjectId(reportId) });

    return NextResponse.json({
      reportId: updated!._id.toString(),
      status: updated!.status,
      structuredReport: structured,
      processingTimeMs,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";

    if (reportId) {
      try {
        const db = await connectDB();
        await db.collection("reports").updateOne(
          { _id: new ObjectId(reportId) },
          {
            $set: {
              status: "error",
              errorMessage: message,
              updatedAt: new Date(),
            },
          },
        );
      } catch {
        // ignore secondary errors
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

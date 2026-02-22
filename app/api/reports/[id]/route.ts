import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

type RouteContext = { params: Promise<{ id: string }> };

function serializeReport(report: { _id: ObjectId; [k: string]: unknown } | null) {
  if (!report) return null;
  return { ...report, _id: report._id.toString() };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = await connectDB();
    const report = await db.collection("reports").findOne({ _id: new ObjectId(id) });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(serializeReport(report as { _id: ObjectId; [k: string]: unknown }));
  } catch (err) {
    console.error("Get report error:", err);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const db = await connectDB();
    const result = await db.collection("reports").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          supervisorNotes: body.supervisorNotes,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(
      serializeReport(result as { _id: ObjectId; [k: string]: unknown }),
    );
  } catch (err) {
    console.error("Update report error:", err);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = await connectDB();
    const result = await db.collection("reports").findOneAndDelete({
      _id: new ObjectId(id),
    });

    if (!result) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete report error:", err);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}

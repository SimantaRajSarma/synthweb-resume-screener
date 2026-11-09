import { NextRequest, NextResponse } from "next/server";
import { getAnalysisById } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { error: "Invalid analysis ID." },
        { status: 400 }
      );
    }

    const record = getAnalysisById(numericId);
    if (!record) {
      return NextResponse.json(
        { error: "Analysis not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ analysis: record });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve analysis details." },
      { status: 500 }
    );
  }
}

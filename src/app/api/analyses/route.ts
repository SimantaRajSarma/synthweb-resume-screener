import { NextRequest, NextResponse } from "next/server";
import { searchAnalyses } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nameParam = searchParams.get("name") ?? undefined;
    const minScoreParam = searchParams.get("minScore");
    const maxScoreParam = searchParams.get("maxScore");

    let minScore: number | undefined;
    let maxScore: number | undefined;

    if (minScoreParam !== null && minScoreParam.trim() !== "") {
      const parsed = Number(minScoreParam);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        return NextResponse.json(
          { error: "minScore must be a valid number between 0 and 100." },
          { status: 400 }
        );
      }
      minScore = parsed;
    }

    if (maxScoreParam !== null && maxScoreParam.trim() !== "") {
      const parsed = Number(maxScoreParam);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        return NextResponse.json(
          { error: "maxScore must be a valid number between 0 and 100." },
          { status: 400 }
        );
      }
      maxScore = parsed;
    }

    if (
      minScore !== undefined &&
      maxScore !== undefined &&
      minScore > maxScore
    ) {
      return NextResponse.json(
        { error: "minScore cannot be greater than maxScore." },
        { status: 400 }
      );
    }

    const records = searchAnalyses({
      name: nameParam,
      minScore,
      maxScore,
    });

    return NextResponse.json({ analyses: records });
  } catch (err) {
    const safeMsg =
      err instanceof Error ? err.message.slice(0, 120) : "Unknown DB error";
    console.error(`[api/analyses] Failed to fetch analyses: ${safeMsg}`);
    return NextResponse.json(
      { error: "Failed to load screening history from database." },
      { status: 500 }
    );
  }
}

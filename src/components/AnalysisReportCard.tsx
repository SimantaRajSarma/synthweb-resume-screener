"use client";

import React from "react";
import type { AnalysisResult } from "@/lib/schema";

interface AnalysisReportCardProps {
  analysis: AnalysisResult;
  warnings?: string[];
  createdAt?: string;
}

/**
 * Safely parses SQLite UTC datetime strings ("YYYY-MM-DD HH:MM:SS") across all browsers (including Safari/WebKit).
 */
export function formatEvaluationDate(rawDate: string): string {
  const isoNormalized = rawDate.includes("T")
    ? rawDate
    : rawDate.replace(" ", "T") + (rawDate.endsWith("Z") ? "" : "Z");
  const parsed = new Date(isoNormalized);
  return Number.isNaN(parsed.getTime()) ? rawDate : parsed.toLocaleString();
}

export function getScoreTier(score: number): {
  label: string;
  tierRange: string;
  badgeStyle: string;
  barColor: string;
  scoreColor: string;
} {
  if (score >= 81) {
    return {
      label: "Excellent Fit",
      tierRange: "81–100 Tier",
      badgeStyle: "bg-[#137CC8] text-white",
      barColor: "bg-[#137CC8]",
      scoreColor: "text-[#137CC8]",
    };
  }
  if (score >= 61) {
    return {
      label: "Good Fit",
      tierRange: "61–80 Tier",
      badgeStyle: "bg-[#EAF3FC] text-[#137CC8] border border-[#137CC8]/30",
      barColor: "bg-[#1479C7]",
      scoreColor: "text-[#083251]",
    };
  }
  if (score >= 31) {
    return {
      label: "Partial Fit",
      tierRange: "31–60 Tier",
      badgeStyle: "bg-[#F5E68A] text-[#083251]",
      barColor: "bg-[#083251]/70",
      scoreColor: "text-[#083251]",
    };
  }
  return {
    label: "Low Fit",
    tierRange: "0–30 Tier",
    badgeStyle: "bg-[#C62828]/10 text-[#C62828] border border-[#C62828]/30",
    barColor: "bg-[#C62828]",
    scoreColor: "text-[#C62828]",
  };
}

export function AnalysisReportCard({
  analysis,
  warnings = [],
  createdAt,
}: AnalysisReportCardProps) {
  const tier = getScoreTier(analysis.match_score);

  return (
    <div className="sw-animate-in space-y-[18px] sm:space-y-[24px]">
      {/* Security / Truncation Notice Banner using Tertiary #F5E68A */}
      {warnings.length > 0 && (
        <div
          role="alert"
          className="rounded-[4px] border border-[#083251]/20 bg-[#F5E68A] px-[18px] py-[14px] text-[#083251] transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#083251]" />
            <span className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[1.68px]">
              Security &amp; Input Guard Notice
            </span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[13px] sm:text-[14px] leading-[21px]">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Executive Summary Card */}
      <div className="sw-card">
        <div className="flex flex-col gap-[16px] sm:flex-row sm:items-center sm:justify-between border-b border-[#dbe8f4] pb-[18px]">
          <div className="min-w-0">
            <p className="sw-kicker">Candidate Assessment</p>
            <h2 className="mt-1 text-[22px] sm:text-[26px] font-semibold leading-[30px] sm:leading-[34px] text-[#083251] break-words">
              {analysis.candidate_name}
            </h2>
            {createdAt && (
              <p className="mt-1 text-[12px] leading-[18px] text-[#083251]/60">
                Evaluated {formatEvaluationDate(createdAt)}
              </p>
            )}
          </div>

          {/* SynthWeb Stat Card for Match Score */}
          <div className="sw-stat-card flex items-center justify-between gap-[18px] sm:min-w-[220px] shrink-0">
            <div>
              <span
                className={`inline-block rounded-[4px] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${tier.badgeStyle}`}
              >
                {tier.label}
              </span>
              <p className="mt-1.5 text-[12px] font-medium text-[#083251]/70">
                Match Score ({tier.tierRange})
              </p>
            </div>
            <div className="text-right">
              <span className={`sw-stat-value ${tier.scoreColor}`}>
                {analysis.match_score}
              </span>
              <span className="text-[14px] font-medium text-[#083251]/50">
                /100
              </span>
            </div>
          </div>
        </div>

        {/* Rubric Progress Bar */}
        <div className="mt-[18px]">
          <div className="mb-[8px] flex items-center justify-between text-[12px] font-medium text-[#083251]/75">
            <span>Rubric Calibration</span>
            <span className="font-semibold text-[#137CC8]">
              {analysis.match_score}% Alignment
            </span>
          </div>
          <div className="h-[8px] w-full overflow-hidden rounded-[4px] bg-[#EAF3FC]">
            <div
              className={`h-full transition-all duration-700 ease-out ${tier.barColor}`}
              style={{
                width: `${Math.min(100, Math.max(0, analysis.match_score))}%`,
              }}
            />
          </div>
          <div className="mt-[8px] grid grid-cols-2 gap-1 sm:grid-cols-4 text-[11px] text-[#083251]/55">
            <span>0–30 Poor</span>
            <span className="text-right sm:text-center">31–60 Partial</span>
            <span className="sm:text-center">61–80 Good</span>
            <span className="text-right">81–100 Excellent</span>
          </div>
        </div>
      </div>

      {/* Matching Skills & Identified Gaps */}
      <div className="grid gap-[18px] md:grid-cols-2">
        {/* 5 Matching Skills */}
        <div className="sw-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#dbe8f4] pb-[12px] mb-[16px]">
              <div>
                <p className="sw-kicker">Verified Strengths</p>
                <h3 className="sw-headline-sm mt-0.5">5 Matching Skills</h3>
              </div>
              <span className="rounded-[4px] bg-[#EAF3FC] px-2.5 py-1 text-[12px] font-semibold text-[#137CC8]">
                {analysis.matching_skills.length} / 5
              </span>
            </div>

            <ul className="space-y-[10px]">
              {analysis.matching_skills.map((skill, index) => (
                <li
                  key={index}
                  className="flex items-start gap-[10px] rounded-[4px] bg-[#EAF3FC]/55 px-[12px] py-[10px] text-[13px] sm:text-[14px] leading-[21px] text-[#083251] transition-colors hover:bg-[#EAF3FC]"
                >
                  <span className="mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-[#137CC8] text-[11px] font-semibold text-white">
                    ✓
                  </span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3 Identified Gaps */}
        <div className="sw-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#dbe8f4] pb-[12px] mb-[16px]">
              <div>
                <p className="sw-kicker">Risk Areas</p>
                <h3 className="sw-headline-sm mt-0.5">3 Identified Gaps</h3>
              </div>
              <span className="rounded-[4px] bg-[#F5E68A] px-2.5 py-1 text-[12px] font-semibold text-[#083251]">
                {analysis.gaps.length} / 3
              </span>
            </div>

            <ul className="space-y-[10px]">
              {analysis.gaps.map((gap, index) => (
                <li
                  key={index}
                  className="flex items-start gap-[10px] rounded-[4px] border border-[#dbe8f4] bg-white px-[12px] py-[10px] text-[13px] sm:text-[14px] leading-[21px] text-[#083251] transition-colors hover:border-[#137CC8]/40"
                >
                  <span className="mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-[#F5E68A] text-[11px] font-bold text-[#083251]">
                    !
                  </span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3 Interview Questions */}
      <div className="sw-card">
        <div className="flex items-center justify-between border-b border-[#dbe8f4] pb-[12px] mb-[16px]">
          <div>
            <p className="sw-kicker">Structured Interview Guide</p>
            <h3 className="sw-headline-sm mt-0.5">
              3 Recommended Interview Questions
            </h3>
          </div>
          <span className="rounded-[4px] bg-[#083251] px-2.5 py-1 text-[12px] font-semibold text-white shrink-0">
            3 Questions
          </span>
        </div>

        <ol className="space-y-[10px]">
          {analysis.interview_questions.map((question, index) => (
            <li
              key={index}
              className="flex items-start gap-[12px] sm:gap-[14px] rounded-[4px] bg-[#EAF3FC]/65 p-[12px] sm:p-[14px] text-[13px] sm:text-[14px] leading-[21px] text-[#083251] transition-colors hover:bg-[#EAF3FC]"
            >
              <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[4px] bg-[#083251] text-[12px] font-semibold text-white">
                0{index + 1}
              </span>
              <span className="pt-[1px]">{question}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import type { AnalysisResult } from "@/lib/schema";

interface AnalysisReportCardProps {
  analysis: AnalysisResult;
  warnings?: string[];
  createdAt?: string;
}

export function getScoreStyle(score: number): {
  label: string;
  badgeBg: string;
  badgeText: string;
  barColor: string;
  ringColor: string;
} {
  if (score >= 81) {
    return {
      label: "Excellent Match",
      badgeBg: "bg-emerald-50 border-emerald-200",
      badgeText: "text-emerald-700",
      barColor: "bg-emerald-500",
      ringColor: "text-emerald-600",
    };
  }
  if (score >= 61) {
    return {
      label: "Good Match",
      badgeBg: "bg-blue-50 border-blue-200",
      badgeText: "text-blue-700",
      barColor: "bg-blue-500",
      ringColor: "text-blue-600",
    };
  }
  if (score >= 31) {
    return {
      label: "Partial Match",
      badgeBg: "bg-amber-50 border-amber-200",
      badgeText: "text-amber-700",
      barColor: "bg-amber-500",
      ringColor: "text-amber-600",
    };
  }
  return {
    label: "Low Match",
    badgeBg: "bg-rose-50 border-rose-200",
    badgeText: "text-rose-700",
    barColor: "bg-rose-500",
    ringColor: "text-rose-600",
  };
}

export function AnalysisReportCard({
  analysis,
  warnings = [],
  createdAt,
}: AnalysisReportCardProps) {
  const scoreStyle = getScoreStyle(analysis.match_score);

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {warnings.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <div className="font-semibold mb-1">Security & Input Notice</div>
          <ul className="list-disc pl-5 space-y-1">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Header & Score Summary */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Candidate Assessment Report
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {analysis.candidate_name}
          </h2>
          {createdAt && (
            <p className="mt-1 text-xs text-slate-500">
              Evaluated on {new Date(createdAt + "Z").toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-5 py-3.5">
          <div className="text-right">
            <span
              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${scoreStyle.badgeBg} ${scoreStyle.badgeText}`}
            >
              {scoreStyle.label}
            </span>
            <p className="mt-1 text-xs text-slate-500">Overall Match Score</p>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-4xl font-extrabold ${scoreStyle.ringColor}`}>
              {analysis.match_score}
            </span>
            <span className="text-sm font-medium text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
          <span>Rubric Alignment</span>
          <span>{analysis.match_score}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${scoreStyle.barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, analysis.match_score))}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
          <span>0–30 Poor</span>
          <span>31–60 Partial</span>
          <span>61–80 Good</span>
          <span>81–100 Excellent</span>
        </div>
      </div>

      {/* Matching Skills & Gaps Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 5 Matching Skills */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-emerald-950 text-sm uppercase tracking-wide">
              Matching Skills & Strengths
            </h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              {analysis.matching_skills.length} items
            </span>
          </div>
          <ul className="space-y-2.5">
            {analysis.matching_skills.map((skill, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 text-sm text-slate-800"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  ✓
                </span>
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3 Gaps */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-amber-950 text-sm uppercase tracking-wide">
              Identified Gaps & Risks
            </h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {analysis.gaps.length} items
            </span>
          </div>
          <ul className="space-y-2.5">
            {analysis.gaps.map((gap, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 text-sm text-slate-800"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                  !
                </span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3 Interview Questions */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-indigo-950 text-sm uppercase tracking-wide">
            Recommended Interview Questions
          </h3>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
            {analysis.interview_questions.length} questions
          </span>
        </div>
        <ol className="space-y-3">
          {analysis.interview_questions.map((question, index) => (
            <li
              key={index}
              className="flex items-start gap-3 rounded-lg bg-white p-3.5 text-sm text-slate-800 shadow-xs border border-indigo-100/80"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span className="leading-relaxed">{question}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

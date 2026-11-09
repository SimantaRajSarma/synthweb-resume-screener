"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ParsedAnalysisRecord } from "@/lib/db";
import {
  AnalysisReportCard,
  getScoreStyle,
} from "@/components/AnalysisReportCard";

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<ParsedAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [minScoreFilter, setMinScoreFilter] = useState("");
  const [maxScoreFilter, setMaxScoreFilter] = useState("");

  const [selectedRecord, setSelectedRecord] =
    useState<ParsedAnalysisRecord | null>(null);

  const fetchAnalyses = useCallback(
    async (filters?: { name?: string; minScore?: string; maxScore?: string }) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        const nameVal = filters ? filters.name : nameFilter;
        const minVal = filters ? filters.minScore : minScoreFilter;
        const maxVal = filters ? filters.maxScore : maxScoreFilter;

        if (nameVal && nameVal.trim() !== "") {
          params.set("name", nameVal.trim());
        }
        if (minVal && minVal.trim() !== "") {
          params.set("minScore", minVal.trim());
        }
        if (maxVal && maxVal.trim() !== "") {
          params.set("maxScore", maxVal.trim());
        }

        const queryString = params.toString();
        const url = queryString
          ? `/api/analyses?${queryString}`
          : "/api/analyses";

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load screening history.");
          setAnalyses([]);
          return;
        }

        const list = (data.analyses || []) as ParsedAnalysisRecord[];
        setAnalyses(list);

        if (selectedRecord) {
          const updated = list.find((item) => item.id === selectedRecord.id);
          setSelectedRecord(updated ?? null);
        }
      } catch {
        setError("Network error while loading screening history.");
      } finally {
        setLoading(false);
      }
    },
    [nameFilter, minScoreFilter, maxScoreFilter, selectedRecord]
  );

  useEffect(() => {
    fetchAnalyses({ name: "", minScore: "", maxScore: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalyses();
  };

  const handleReset = () => {
    setNameFilter("");
    setMinScoreFilter("");
    setMaxScoreFilter("");
    fetchAnalyses({ name: "", minScore: "", maxScore: "" });
  };

  const buildWarningsForRecord = (record: ParsedAnalysisRecord): string[] => {
    const warnings: string[] = [];
    const meta = record.result.meta;
    if (meta?.wasTruncated) {
      warnings.push(
        "Input exceeded 15,000 characters and was truncated before analysis."
      );
    }
    if (meta?.injectionDetected) {
      warnings.push(
        `Prompt-injection pattern flagged (${
          meta.injectionReasons?.join(", ") || "suspicious directive"
        }).`
      );
    }
    return warnings;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Screening History
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Search past candidate evaluations by name or filter by match score
            range. Click any row to view the full report.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          + New Screening
        </Link>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:grid-cols-12 sm:items-end"
      >
        <div className="sm:col-span-5">
          <label
            htmlFor="search-name"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Candidate Name
          </label>
          <input
            id="search-name"
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="e.g. Rahul, Alex..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="min-score"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Min Score (0-100)
          </label>
          <input
            id="min-score"
            type="number"
            min={0}
            max={100}
            value={minScoreFilter}
            onChange={(e) => setMinScoreFilter(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="max-score"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Max Score (0-100)
          </label>
          <input
            id="max-score"
            type="number"
            min={0}
            max={100}
            value={maxScoreFilter}
            onChange={(e) => setMaxScoreFilter(e.target.value)}
            placeholder="100"
            className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 sm:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      {/* Results Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>Loading screening history...</span>
          </div>
        ) : analyses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No screening analyses found matching your filters.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search criteria or analyze a new candidate
              resume.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Match Score</th>
                  <th className="px-5 py-3.5">Top Matching Skills</th>
                  <th className="px-5 py-3.5">Flags</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {analyses.map((row) => {
                  const style = getScoreStyle(row.match_score);
                  const isSelected = selectedRecord?.id === row.id;
                  const hasInjection = Boolean(
                    row.result.meta?.injectionDetected
                  );
                  const hasTruncation = Boolean(row.result.meta?.wasTruncated);

                  return (
                    <tr
                      key={row.id}
                      onClick={() =>
                        setSelectedRecord(isSelected ? null : row)
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-50/70"
                          : "hover:bg-slate-50/90"
                      }`}
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {new Date(row.created_at + "Z").toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {row.candidate_name}
                      </td>
                      <td className=" whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${style.badgeBg} ${style.badgeText}`}
                        >
                          <span>{row.match_score}/100</span>
                          <span className="font-normal">({style.label})</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate">
                        {row.result.matching_skills?.slice(0, 2).join(" • ")}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {hasInjection && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              Injection Flagged
                            </span>
                          )}
                          {hasTruncation && (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                              Truncated
                            </span>
                          )}
                          {!hasInjection && !hasTruncation && (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold text-indigo-600">
                        {isSelected ? "Hide Report ▲" : "View Report ▼"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Report Detail View */}
      {selectedRecord && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Detailed Report — {selectedRecord.candidate_name} (#
              {selectedRecord.id})
            </h2>
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Close Report
            </button>
          </div>

          <AnalysisReportCard
            analysis={selectedRecord.result}
            warnings={buildWarningsForRecord(selectedRecord)}
            createdAt={selectedRecord.created_at}
          />

          <details className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
            <summary className="cursor-pointer font-semibold text-slate-800">
              View Original Job Description & Resume Input
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-1 font-semibold text-slate-900">
                  Job Description
                </h4>
                <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-xs text-slate-700 border border-slate-200">
                  {selectedRecord.job_description}
                </pre>
              </div>
              <div>
                <h4 className="mb-1 font-semibold text-slate-900">
                  Resume Text
                </h4>
                <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-xs text-slate-700 border border-slate-200">
                  {selectedRecord.resume_text}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

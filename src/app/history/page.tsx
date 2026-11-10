"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { ParsedAnalysisRecord } from "@/lib/db";
import {
  AnalysisReportCard,
  formatEvaluationDate,
  getScoreTier,
} from "@/components/AnalysisReportCard";

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<ParsedAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [minScoreFilter, setMinScoreFilter] = useState("");
  const [maxScoreFilter, setMaxScoreFilter] = useState("");

  // Two-stage drawer state for smooth enter and exit transitions
  const [drawerRecord, setDrawerRecord] =
    useState<ParsedAnalysisRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDrawer = (record: ParsedAnalysisRecord) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDrawerRecord(record);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsDrawerOpen(true);
      });
    });
  };

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setDrawerRecord(null);
      closeTimerRef.current = null;
    }, 300);
  }, []);

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

        if (drawerRecord) {
          const updated = list.find((item) => item.id === drawerRecord.id);
          if (updated) {
            setDrawerRecord(updated);
          } else {
            closeDrawer();
          }
        }
      } catch {
        setError("Network error while loading screening history.");
      } finally {
        setLoading(false);
      }
    },
    [nameFilter, minScoreFilter, maxScoreFilter, drawerRecord, closeDrawer]
  );

  useEffect(() => {
    fetchAnalyses({ name: "", minScore: "", maxScore: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close drawer on Escape key & lock body scroll when drawer is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

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
    <div className="space-y-[22px] sm:space-y-[26px]">
      {/* Editorial Header */}
      <div className="flex flex-col gap-[16px] border-b border-[#dbe8f4] pb-[20px] sm:pb-[26px] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="sw-kicker">Audit &amp; Evaluation Archive</p>
          <h1 className="sw-headline-lg mt-1">Candidate Screening History</h1>
          <p className="mt-2 text-[13px] sm:text-[14px] leading-[21px] sm:leading-[22px] text-[#083251]/75">
            Filter persisted evaluations by candidate name or score range. Tap
            or click any candidate to slide open the full report drawer.
          </p>
        </div>

        <Link
          href="/"
          className="sw-btn-primary w-full sm:w-auto shrink-0 text-center"
        >
          + New Candidate Screening
        </Link>
      </div>

      {/* Filter Bar (#EAF3FC Muted Surface) */}
      <form
        onSubmit={handleFilterSubmit}
        className="grid grid-cols-1 gap-[14px] sm:gap-[18px] rounded-[4px] bg-[#EAF3FC] p-[16px] sm:p-[20px] sm:grid-cols-2 lg:grid-cols-12 lg:items-end"
      >
        <div className="sm:col-span-2 lg:col-span-5">
          <label
            htmlFor="search-name"
            className="mb-[6px] block text-[11px] sm:text-[12px] font-semibold uppercase tracking-[1.2px] text-[#083251]"
          >
            Candidate Name
          </label>
          <input
            id="search-name"
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search by candidate name (e.g. Rahul)..."
            className="sw-input h-[45px] px-[14px]"
          />
        </div>

        <div className="lg:col-span-2">
          <label
            htmlFor="min-score"
            className="mb-[6px] block text-[11px] sm:text-[12px] font-semibold uppercase tracking-[1.2px] text-[#083251]"
          >
            Min Score (0–100)
          </label>
          <input
            id="min-score"
            type="number"
            min={0}
            max={100}
            value={minScoreFilter}
            onChange={(e) => setMinScoreFilter(e.target.value)}
            placeholder="0"
            className="sw-input h-[45px] px-[14px]"
          />
        </div>

        <div className="lg:col-span-2">
          <label
            htmlFor="max-score"
            className="mb-[6px] block text-[11px] sm:text-[12px] font-semibold uppercase tracking-[1.2px] text-[#083251]"
          >
            Max Score (0–100)
          </label>
          <input
            id="max-score"
            type="number"
            min={0}
            max={100}
            value={maxScoreFilter}
            onChange={(e) => setMaxScoreFilter(e.target.value)}
            placeholder="100"
            className="sw-input h-[45px] px-[14px]"
          />
        </div>

        <div className="flex items-center gap-[10px] sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="sw-btn-primary flex-1"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="sw-btn-secondary !bg-white flex-1 sm:flex-initial"
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="sw-animate-in rounded-[4px] border border-[#C62828]/30 bg-[#C62828]/5 px-[20px] py-[14px] text-[14px] text-[#C62828]"
        >
          {error}
        </div>
      )}

      {/* Results Container */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-[4px] border border-[#dbe8f4] bg-white py-[48px] text-[14px] text-[#083251]/70">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#137CC8] border-t-transparent" />
          <span>Loading screening archive...</span>
        </div>
      ) : analyses.length === 0 ? (
        <div className="rounded-[4px] border border-[#dbe8f4] bg-white py-[54px] px-4 text-center">
          <p className="sw-headline-sm">No Matching Screening Records</p>
          <p className="mt-1 text-[14px] text-[#083251]/65">
            Adjust your search filters above or run a new candidate screening.
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE / SMALL SCREEN VIEW: Stacked Tap-Friendly Cards (< 768px) */}
          <div className="grid grid-cols-1 gap-[12px] md:hidden">
            {analyses.map((row) => {
              const tier = getScoreTier(row.match_score);
              const isSelected =
                drawerRecord?.id === row.id && isDrawerOpen;
              const hasInjection = Boolean(
                row.result.meta?.injectionDetected
              );
              const hasTruncation = Boolean(row.result.meta?.wasTruncated);

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openDrawer(row)}
                  className={`sw-card text-left w-full transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#137CC8] bg-[#EAF3FC]/60"
                      : "hover:border-[#137CC8]/60 hover:bg-[#EAF3FC]/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-[#083251]/55">
                        {formatEvaluationDate(row.created_at)}
                      </p>
                      <h3 className="mt-0.5 text-[16px] font-semibold text-[#083251]">
                        {row.candidate_name}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[20px] font-semibold text-[#083251]">
                        {row.match_score}
                        <span className="text-[12px] font-normal text-[#083251]/50">
                          /100
                        </span>
                      </span>
                      <div className="mt-0.5">
                        <span
                          className={`inline-block rounded-[4px] px-2 py-0.5 text-[10px] font-semibold uppercase ${tier.badgeStyle}`}
                        >
                          {tier.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {row.result.matching_skills?.length > 0 && (
                    <p className="mt-3 truncate text-[12px] text-[#083251]/75">
                      <span className="font-semibold text-[#083251]">
                        Top skills:{" "}
                      </span>
                      {row.result.matching_skills.slice(0, 3).join(" • ")}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-[#dbe8f4] pt-2.5 text-[12px]">
                    <div className="flex flex-wrap gap-1.5">
                      {hasInjection && (
                        <span className="rounded-[4px] bg-[#F5E68A] px-2 py-0.5 text-[10px] font-semibold text-[#083251]">
                          Injection Flagged
                        </span>
                      )}
                      {hasTruncation && (
                        <span className="rounded-[4px] bg-[#EAF3FC] px-2 py-0.5 text-[10px] font-semibold text-[#137CC8]">
                          Truncated
                        </span>
                      )}
                      {!hasInjection && !hasTruncation && (
                        <span className="text-[#083251]/45 text-[11px]">
                          Verified Evaluation
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-[#137CC8]">
                      View Report &rarr;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* MEDIUM & DESKTOP VIEW: Full Table (>= 768px) */}
          <div className="hidden md:block overflow-hidden rounded-[4px] border border-[#dbe8f4] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#dbe8f4] bg-[#EAF3FC]/70 text-[11px] font-semibold uppercase tracking-[1.4px] text-[#083251]">
                    <th className="px-[20px] py-[14px]">Date Evaluated</th>
                    <th className="px-[20px] py-[14px]">Candidate Name</th>
                    <th className="px-[20px] py-[14px]">Match Score</th>
                    <th className="px-[20px] py-[14px]">Key Matching Skills</th>
                    <th className="px-[20px] py-[14px]">Security / Status</th>
                    <th className="px-[20px] py-[14px] text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe8f4] text-[14px]">
                  {analyses.map((row) => {
                    const tier = getScoreTier(row.match_score);
                    const isSelected =
                      drawerRecord?.id === row.id && isDrawerOpen;
                    const hasInjection = Boolean(
                      row.result.meta?.injectionDetected
                    );
                    const hasTruncation = Boolean(
                      row.result.meta?.wasTruncated
                    );

                    return (
                      <tr
                        key={row.id}
                        onClick={() => openDrawer(row)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? "bg-[#EAF3FC]"
                            : "hover:bg-[#EAF3FC]/45"
                        }`}
                      >
                        <td className="whitespace-nowrap px-[20px] py-[16px] text-[12px] text-[#083251]/65">
                          {formatEvaluationDate(row.created_at)}
                        </td>
                        <td className="px-[20px] py-[16px] font-semibold text-[#083251]">
                          {row.candidate_name}
                        </td>
                        <td className="whitespace-nowrap px-[20px] py-[16px]">
                          <div className="flex items-center gap-[10px]">
                            <span className="text-[18px] font-semibold text-[#083251]">
                              {row.match_score}
                              <span className="text-[12px] font-normal text-[#083251]/50">
                                /100
                              </span>
                            </span>
                            <span
                              className={`rounded-[4px] px-2 py-0.5 text-[11px] font-semibold ${tier.badgeStyle}`}
                            >
                              {tier.label}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-xs truncate px-[20px] py-[16px] text-[13px] text-[#083251]/75">
                          {row.result.matching_skills?.slice(0, 2).join(" • ")}
                        </td>
                        <td className="px-[20px] py-[16px] text-[12px]">
                          <div className="flex flex-wrap gap-1.5">
                            {hasInjection && (
                              <span className="rounded-[4px] bg-[#F5E68A] px-2 py-0.5 text-[11px] font-semibold text-[#083251]">
                                Injection Flagged
                              </span>
                            )}
                            {hasTruncation && (
                              <span className="rounded-[4px] bg-[#EAF3FC] px-2 py-0.5 text-[11px] font-semibold text-[#137CC8]">
                                Truncated
                              </span>
                            )}
                            {!hasInjection && !hasTruncation && (
                              <span className="text-[#083251]/40">Verified</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-[20px] py-[16px] text-right text-[13px] font-semibold text-[#137CC8]">
                          Open Drawer &rarr;
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Smooth Slide-Over Right Drawer / Modal for Selected Candidate Report */}
      {drawerRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Candidate assessment report for ${drawerRecord.candidate_name}`}
          className={`fixed inset-0 z-50 flex justify-end transition-colors duration-300 ease-out ${
            isDrawerOpen
              ? "bg-[#083251]/45 backdrop-blur-[1px]"
              : "bg-[#083251]/0 pointer-events-none"
          }`}
          onClick={closeDrawer}
        >
          <div
            className={`relative flex h-full w-full max-w-[740px] flex-col bg-white shadow-2xl overflow-hidden transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isDrawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#dbe8f4] bg-white px-[18px] py-[14px] sm:px-[26px] sm:py-[18px]">
              <div className="min-w-0">
                <p className="sw-kicker">
                  Screening Record #{drawerRecord.id}
                </p>
                <h2 className="sw-headline-md mt-0.5 truncate">
                  {drawerRecord.candidate_name}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="shrink-0 rounded-[4px] bg-[#EAF3FC] px-[12px] py-[8px] sm:px-[14px] text-[12px] sm:text-[13px] font-semibold text-[#083251] hover:bg-[#137CC8] hover:text-white transition-colors duration-200 cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-[16px] sm:p-[26px] space-y-[20px] sm:space-y-[26px]">
              <AnalysisReportCard
                analysis={drawerRecord.result}
                warnings={buildWarningsForRecord(drawerRecord)}
                createdAt={drawerRecord.created_at}
              />

              {/* Original Submitted Inputs */}
              <div className="sw-card space-y-[16px]">
                <div>
                  <p className="sw-kicker">Audit Trail</p>
                  <h3 className="sw-headline-sm mt-0.5">
                    Submitted Job Description &amp; Resume Text
                  </h3>
                </div>

                <div className="grid gap-[16px] md:grid-cols-2">
                  <div>
                    <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#083251]/70">
                      Job Description
                    </h4>
                    <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-[4px] border border-[#dbe8f4] bg-[#EAF3FC]/35 p-[12px] font-sans text-[12px] leading-[18px] text-[#083251]">
                      {drawerRecord.job_description}
                    </pre>
                  </div>
                  <div>
                    <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#083251]/70">
                      Candidate Resume
                    </h4>
                    <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-[4px] border border-[#dbe8f4] bg-[#EAF3FC]/35 p-[12px] font-sans text-[12px] leading-[18px] text-[#083251]">
                      {drawerRecord.resume_text}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

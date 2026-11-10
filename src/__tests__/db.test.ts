import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { initDatabase, insertAnalysis, searchAnalyses } from "@/lib/db";

describe("SQLite Database & History Filtering", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase(":memory:");
  });

  const baseResult = {
    matching_skills: ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
    gaps: ["Gap 1", "Gap 2", "Gap 3"],
    interview_questions: ["Q1?", "Q2?", "Q3?"],
  };

  it("inserts analyses and filters by candidate name, minScore, and maxScore", () => {
    insertAnalysis(
      {
        candidate_name: "Rahul Sharma",
        match_score: 88,
        result: {
          candidate_name: "Rahul Sharma",
          match_score: 88,
          ...baseResult,
        },
        job_description: "Full Stack Engineer",
        resume_text: "Rahul resume text",
      },
      db
    );

    insertAnalysis(
      {
        candidate_name: "Priya Patel",
        match_score: 72,
        result: {
          candidate_name: "Priya Patel",
          match_score: 72,
          ...baseResult,
        },
        job_description: "Full Stack Engineer",
        resume_text: "Priya resume text",
      },
      db
    );

    insertAnalysis(
      {
        candidate_name: "Alex Mercer",
        match_score: 24,
        result: {
          candidate_name: "Alex Mercer",
          match_score: 24,
          ...baseResult,
        },
        job_description: "Full Stack Engineer",
        resume_text: "Alex resume text",
      },
      db
    );

    // 1. Filter by name substring (case-insensitive)
    const rahulMatches = searchAnalyses({ name: "rahul" }, db);
    expect(rahulMatches).toHaveLength(1);
    expect(rahulMatches[0].candidate_name).toBe("Rahul Sharma");

    // 2. Filter by minScore and maxScore range
    const midToHigh = searchAnalyses({ minScore: 60, maxScore: 90 }, db);
    expect(midToHigh).toHaveLength(2);
    expect(midToHigh.map((r) => r.candidate_name)).toEqual(
      expect.arrayContaining(["Rahul Sharma", "Priya Patel"])
    );

    // 3. Verify SQL injection attempt & wildcard escaping in name parameter
    const injectionSearch = searchAnalyses(
      { name: "'; DROP TABLE analyses; --" },
      db
    );
    expect(injectionSearch).toHaveLength(0);

    const wildcardSearch = searchAnalyses({ name: "100%" }, db);
    expect(wildcardSearch).toHaveLength(0);

    // Table still intact
    const allRows = searchAnalyses({}, db);
    expect(allRows).toHaveLength(3);
  });
});

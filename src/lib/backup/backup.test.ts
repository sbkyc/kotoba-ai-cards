import { describe, expect, it } from "vitest";
import { createBackup, parseBackup } from "./backup";
import type { AppSettings } from "@/lib/settings/settings";

const settings: AppSettings = {
  level: "N2",
  dailyGoal: 10,
  aiEnabled: false,
  provider: "openai",
  apiKey: "sk-live-should-not-export",
  model: "gpt-5.5",
  endpoint: "https://api.openai.com/v1/responses",
};

describe("backup helpers", () => {
  it("exports settings and progress with a version and timestamp", () => {
    const backup = createBackup({
      settings,
      progress: {},
      favorites: ["n2-houshin"],
      reviewEvents: [{ cardId: "n2-houshin", rating: "known", reviewedAt: "2026-06-16T00:00:00.000Z" }],
      practiceSessions: [
        {
          id: "practice-1",
          level: "N2",
          title: "N2 ????",
          takenAt: "2026-06-16T00:30:00.000Z",
          total: 10,
          correct: 7,
          accuracy: 70,
          weakCardIds: ["n2-houshin"],
        },
      ],
      exportedAt: new Date("2026-06-16T00:00:00.000Z"),
    });

    expect(JSON.parse(backup)).toEqual({
      version: 2,
      exportedAt: "2026-06-16T00:00:00.000Z",
      settings: { ...settings, apiKey: "" },
      progress: {},
      favorites: ["n2-houshin"],
      reviewEvents: [{ cardId: "n2-houshin", rating: "known", reviewedAt: "2026-06-16T00:00:00.000Z" }],
      practiceSessions: [
        {
          id: "practice-1",
          level: "N2",
          title: "N2 ????",
          takenAt: "2026-06-16T00:30:00.000Z",
          total: 10,
          correct: 7,
          accuracy: 70,
          weakCardIds: ["n2-houshin"],
        },
      ],
    });
  });

  it("parses a valid backup", () => {
    const backup = createBackup({
      settings,
      progress: {},
      favorites: [],
      reviewEvents: [],
      practiceSessions: [],
      exportedAt: new Date("2026-06-16T00:00:00.000Z"),
    });

    expect(parseBackup(backup)).toEqual({
      ok: true,
      data: {
        version: 2,
        exportedAt: "2026-06-16T00:00:00.000Z",
        settings: { ...settings, apiKey: "" },
        progress: {},
        favorites: [],
        reviewEvents: [],
        practiceSessions: [],
      },
    });
  });

  it("migrates a version 1 backup with an empty review history and drops saved API keys", () => {
    const legacySettings = { ...settings };
    delete (legacySettings as Partial<AppSettings>).provider;

    expect(
      parseBackup(
        JSON.stringify({
          version: 1,
          exportedAt: "2026-06-16T00:00:00.000Z",
          settings: legacySettings,
          progress: {},
          favorites: [],
        }),
      ),
    ).toEqual({
      ok: true,
      data: {
        version: 2,
        exportedAt: "2026-06-16T00:00:00.000Z",
        settings: { ...settings, apiKey: "" },
        progress: {},
        favorites: [],
        reviewEvents: [],
        practiceSessions: [],
      },
    });
  });

  it("rejects invalid JSON and unsupported versions", () => {
    expect(parseBackup("not-json")).toEqual({ ok: false, error: "???????? JSON?" });
    expect(parseBackup(JSON.stringify({ version: 99 }))).toEqual({ ok: false, error: "?????????" });
  });

  it("never includes API keys in exported backup text", () => {
    const backup = createBackup({
      settings,
      progress: {},
      favorites: [],
      reviewEvents: [],
      exportedAt: new Date("2026-06-16T00:00:00.000Z"),
    });

    expect(backup).not.toContain("sk-live-should-not-export");
    expect(JSON.parse(backup).settings.apiKey).toBe("");
  });
});

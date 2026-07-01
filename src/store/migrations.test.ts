import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/settings/settings";
import { migrateStudyState, studyStoreVersion } from "./migrations";

describe("study store migrations", () => {
  it("fills missing persisted arrays and merges settings defaults", () => {
    expect(migrateStudyState({ settings: { level: "N2" }, progress: {} })).toMatchObject({
      settings: { ...defaultSettings, level: "N2" },
      progress: {},
      favorites: [],
      reviewEvents: [],
      practiceSessions: [],
    });
  });

  it("migrates legacy aiProvider settings to provider", () => {
    const migrated = migrateStudyState({
        settings: {
          level: "CET6",
          aiProvider: "deepseek",
          apiKey: "key",
          model: "deepseek-chat",
          endpoint: "https://api.deepseek.com/chat/completions",
        },
        progress: {},
      });

    expect(migrated).toMatchObject({
      settings: {
        provider: "deepseek",
        level: "CET6",
        apiKey: "key",
      },
    });
    expect(migrated.settings).not.toHaveProperty("aiProvider");
  });

  it("exports a positive persist version", () => {
    expect(studyStoreVersion).toBeGreaterThan(0);
  });
});

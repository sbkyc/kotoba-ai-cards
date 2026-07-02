import type { ReviewEvent } from "@/lib/activity/activity";
import type { PracticeSessionSummary } from "@/lib/practice/practice";
import type { ProgressMap } from "@/lib/progress/progress";
import { defaultSettings, type AppSettings } from "@/lib/settings/settings";

export type AppBackup = {
  version: 2;
  exportedAt: string;
  settings: AppSettings;
  progress: ProgressMap;
  favorites: string[];
  reviewEvents: ReviewEvent[];
  practiceSessions: PracticeSessionSummary[];
};

type CreateBackupInput = {
  settings: AppSettings;
  progress: ProgressMap;
  favorites: string[];
  reviewEvents: ReviewEvent[];
  practiceSessions?: PracticeSessionSummary[];
  exportedAt?: Date;
};

export type ParseBackupResult = { ok: true; data: AppBackup } | { ok: false; error: string };

export function createBackup({
  settings,
  progress,
  favorites,
  reviewEvents,
  practiceSessions = [],
  exportedAt = new Date(),
}: CreateBackupInput): string {
  const safeSettings: AppSettings = { ...settings, apiKey: "" };
  const backup: AppBackup = {
    version: 2,
    exportedAt: exportedAt.toISOString(),
    settings: safeSettings,
    progress,
    favorites,
    reviewEvents,
    practiceSessions,
  };

  return JSON.stringify(backup, null, 2);
}

export function parseBackup(value: string): ParseBackupResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return { ok: false, error: "???????? JSON?" };
  }

  if (!isRecord(parsed) || (parsed.version !== 1 && parsed.version !== 2)) {
    return { ok: false, error: "?????????" };
  }

  if (!isRecord(parsed.settings) || !isRecord(parsed.progress) || typeof parsed.exportedAt !== "string") {
    return { ok: false, error: "???????????" };
  }

  if (!Array.isArray(parsed.favorites)) {
    parsed.favorites = [];
  }

  if (!Array.isArray(parsed.reviewEvents)) {
    parsed.reviewEvents = [];
  }

  if (!Array.isArray(parsed.practiceSessions)) {
    parsed.practiceSessions = [];
  }

  const settings = { ...defaultSettings, ...(parsed.settings as Partial<AppSettings>), apiKey: "" };

  return {
    ok: true,
    data: {
      version: 2,
      exportedAt: parsed.exportedAt,
      settings,
      progress: parsed.progress as ProgressMap,
      favorites: parsed.favorites as string[],
      reviewEvents: parsed.reviewEvents as ReviewEvent[],
      practiceSessions: parsed.practiceSessions as PracticeSessionSummary[],
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

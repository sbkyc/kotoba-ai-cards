import { defaultSettings, type AppSettings } from "@/lib/settings/settings";

export const studyStoreVersion = 2;

type PersistedStudyState = {
  settings?: Partial<AppSettings> & { aiProvider?: AppSettings["provider"] };
  progress?: unknown;
  favorites?: unknown;
  reviewEvents?: unknown;
  practiceSessions?: unknown;
};

export function migrateStudyState(persisted: unknown): PersistedStudyState {
  const state = isRecord(persisted) ? (persisted as PersistedStudyState) : {};
  const rawSettings = isRecord(state.settings) ? state.settings : {};
  const provider = rawSettings.provider ?? rawSettings.aiProvider ?? defaultSettings.provider;
  const settingsWithoutLegacy = { ...rawSettings };
  delete settingsWithoutLegacy.aiProvider;

  return {
    ...state,
    settings: {
      ...defaultSettings,
      ...settingsWithoutLegacy,
      provider,
    },
    progress: isRecord(state.progress) ? state.progress : {},
    favorites: Array.isArray(state.favorites) ? state.favorites : [],
    reviewEvents: Array.isArray(state.reviewEvents) ? state.reviewEvents : [],
    practiceSessions: Array.isArray(state.practiceSessions) ? state.practiceSessions : [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

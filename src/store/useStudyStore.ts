"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ReviewEvent } from "@/lib/activity/activity";
import type { PracticeSessionSummary } from "@/lib/practice/practice";
import { defaultSettings, type AppSettings } from "@/lib/settings/settings";
import { scheduleReview, type CardProgress, type ReviewRating } from "@/lib/scheduler/scheduler";
import { toggleFavoriteId } from "@/lib/study/favorites";
import type { StudyLevel } from "@/lib/vocabulary/types";
import { migrateStudyState, studyStoreVersion } from "./migrations";

type StudyState = {
  settings: AppSettings;
  progress: Record<string, CardProgress>;
  favorites: string[];
  reviewEvents: ReviewEvent[];
  practiceSessions: PracticeSessionSummary[];
  setLevel: (level: StudyLevel) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  restoreBackup: (
    settings: AppSettings,
    progress: Record<string, CardProgress>,
    favorites?: string[],
    reviewEvents?: ReviewEvent[],
    practiceSessions?: PracticeSessionSummary[],
  ) => void;
  toggleFavorite: (cardId: string) => void;
  rateCard: (cardId: string, rating: ReviewRating) => void;
  recordPracticeSession: (session: PracticeSessionSummary) => void;
  clearProgress: () => void;
};

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      progress: {},
      favorites: [],
      reviewEvents: [],
      practiceSessions: [],
      setLevel: (level) =>
        set((state) => ({
          settings: { ...state.settings, level },
        })),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
      restoreBackup: (settings, progress, favorites = [], reviewEvents = [], practiceSessions = []) =>
        set({ settings, progress, favorites, reviewEvents, practiceSessions }),
      toggleFavorite: (cardId) => set((state) => ({ favorites: toggleFavoriteId(state.favorites, cardId) })),
      rateCard: (cardId, rating) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [cardId]: scheduleReview(state.progress[cardId], rating),
          },
          reviewEvents: [
            ...state.reviewEvents,
            { cardId, rating, reviewedAt: new Date().toISOString() },
          ].slice(-500),
        })),
      recordPracticeSession: (session) =>
        set((state) => ({
          practiceSessions: [...(state.practiceSessions ?? []), session].slice(-30),
        })),
      clearProgress: () => set({ progress: {}, reviewEvents: [], practiceSessions: [] }),
    }),
    {
      name: "kotoba-ai-cards",
      version: studyStoreVersion,
      migrate: (persisted) => migrateStudyState(persisted),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

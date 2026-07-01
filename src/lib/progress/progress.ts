import type { CardProgress } from "@/lib/scheduler/scheduler";

export type ProgressMap = Record<string, CardProgress>;

export type StudyStats = {
  dueCount: number;
  learnedToday: number;
  knownRate: number;
  totalReviewed: number;
};

export function getDueCardIds(progress: ProgressMap, now = new Date(), cardIds?: string[]): string[] {
  const allowedIds = cardIds ? new Set(cardIds) : undefined;

  return Object.entries(progress)
    .filter(([cardId]) => !allowedIds || allowedIds.has(cardId))
    .filter(([, value]) => new Date(value.dueAt).getTime() <= now.getTime())
    .map(([cardId]) => cardId);
}

export function getStudyStats(progress: ProgressMap, now = new Date(), cardIds?: string[]): StudyStats {
  const allowedIds = cardIds ? new Set(cardIds) : undefined;
  const entries = Object.entries(progress)
    .filter(([cardId]) => !allowedIds || allowedIds.has(cardId))
    .map(([, value]) => value);
  const totalReviewed = entries.filter((item) => item.reviewCount > 0).length;
  const known = entries.filter((item) => item.status === "known").length;
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const learnedToday = entries.filter((item) => {
    if (!item.lastReviewedAt) return false;
    const reviewedAt = new Date(item.lastReviewedAt).getTime();
    return reviewedAt >= startOfDay.getTime() && reviewedAt < endOfDay.getTime();
  }).length;

  return {
    dueCount: getDueCardIds(progress, now, cardIds).length,
    learnedToday,
    knownRate: totalReviewed === 0 ? 0 : Math.round((known / totalReviewed) * 100),
    totalReviewed,
  };
}

export function writeProgressMap(progress: ProgressMap): string {
  return JSON.stringify(progress);
}

export function readProgressMap(value: string | null): ProgressMap {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as ProgressMap;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

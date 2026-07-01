import type { CardProgress, ReviewRating } from "@/lib/scheduler/scheduler";
import type { VocabularyCard } from "@/lib/vocabulary/types";

export type ReviewEvent = {
  cardId: string;
  rating: ReviewRating;
  reviewedAt: string;
};

export type DailyActivity = {
  date: string;
  count: number;
};

export function aggregateRecentActivity(
  events: ReviewEvent[],
  now = new Date(),
  offsetMinutes = -now.getTimezoneOffset(),
): DailyActivity[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    const date = toOffsetDateKey(new Date(event.reviewedAt), offsetMinutes);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - index));
    const key = toOffsetDateKey(date, offsetMinutes);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

export function filterReviewEventsByCardIds(events: ReviewEvent[], cardIds: string[]): ReviewEvent[] {
  const allowedIds = new Set(cardIds);
  return events.filter((event) => allowedIds.has(event.cardId));
}

export function rankDifficultCards(
  cards: VocabularyCard[],
  progress: Record<string, CardProgress>,
  favorites: string[],
  limit = 5,
): VocabularyCard[] {
  return [...cards]
    .sort((a, b) => difficultyScore(b.id, progress, favorites) - difficultyScore(a.id, progress, favorites))
    .slice(0, limit);
}

function difficultyScore(cardId: string, progress: Record<string, CardProgress>, favorites: string[]): number {
  const value = progress[cardId];
  if (!value) return favorites.includes(cardId) ? 1 : 0;

  return (
    value.unknownCount * 4 +
    value.fuzzyCount * 2 +
    (value.status === "learning" ? 2 : 0) +
    (favorites.includes(cardId) ? 1 : 0)
  );
}

function toOffsetDateKey(date: Date, offsetMinutes: number): string {
  return new Date(date.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

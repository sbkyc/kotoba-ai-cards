import type { PracticeSessionSummary } from "@/lib/practice/practice";
import type { CardProgress } from "@/lib/scheduler/scheduler";
import type { VocabularyCard } from "@/lib/vocabulary/types";
import { getDueCardIds } from "./progress";

export type WeakArea = {
  label: string;
  count: number;
};

export type LearningLoopInsight = {
  dueCount: number;
  newCount: number;
  reviewedCount: number;
  masteredCount: number;
  reviewedMasteryRate: number;
  deckMasteryRate: number;
  reviewReminderLabel: string;
  weakSummary: string;
  weakAreas: WeakArea[];
};

type LearningLoopInput = {
  cards: VocabularyCard[];
  progress: Record<string, CardProgress>;
  favoriteIds: string[];
  practiceSessions: PracticeSessionSummary[];
  dailyGoal: number;
  now?: Date;
};

export function buildLearningLoopInsight({
  cards,
  progress,
  favoriteIds,
  practiceSessions,
  dailyGoal,
  now = new Date(),
}: LearningLoopInput): LearningLoopInsight {
  const cardIds = cards.map((card) => card.id);
  const cardIdSet = new Set(cardIds);
  const entries = cardIds.flatMap((cardId) => {
    const cardProgress = progress[cardId];
    return cardProgress ? [{ cardId, progress: cardProgress }] : [];
  });
  const dueCount = getDueCardIds(progress, now, cardIds).length;
  const newCount = Math.max(cards.filter((card) => !progress[card.id]).length, 0);
  const reviewedCount = entries.filter((entry) => entry.progress.reviewCount > 0).length;
  const masteredCount = entries.filter((entry) => entry.progress.status === "known").length;
  const weakProgressIds = new Set(
    entries
      .filter((entry) => entry.progress.unknownCount > 0 || entry.progress.fuzzyCount > 0 || entry.progress.status === "learning")
      .map((entry) => entry.cardId),
  );
  const weakPracticeIds = new Set(
    practiceSessions.flatMap((session) => session.weakCardIds).filter((cardId) => cardIdSet.has(cardId)),
  );
  const favoriteWeakCount = favoriteIds.filter((cardId) => cardIdSet.has(cardId)).length;
  const weakAreas = [
    { label: "复习薄弱词", count: weakProgressIds.size },
    { label: "AI 小测错题", count: weakPracticeIds.size },
    { label: "重点收藏词", count: favoriteWeakCount },
  ].filter((area) => area.count > 0);
  const totalWeak = new Set([...weakProgressIds, ...weakPracticeIds, ...favoriteIds.filter((cardId) => cardIdSet.has(cardId))]).size;

  return {
    dueCount,
    newCount: Math.min(newCount, Math.max(dailyGoal - dueCount, 0)),
    reviewedCount,
    masteredCount,
    reviewedMasteryRate: reviewedCount ? Math.round((masteredCount / reviewedCount) * 100) : 0,
    deckMasteryRate: cards.length ? Math.round((masteredCount / cards.length) * 100) : 0,
    reviewReminderLabel: buildReviewReminder(entries.map((entry) => entry.progress), dueCount, now),
    weakSummary: totalWeak ? `${totalWeak} 个词需要闭环复盘` : "暂无明显弱项",
    weakAreas,
  };
}

function buildReviewReminder(progressItems: CardProgress[], dueCount: number, now: Date): string {
  if (dueCount > 0) return "现在复习";
  const nextDue = progressItems
    .map((item) => new Date(item.dueAt).getTime())
    .filter((time) => Number.isFinite(time) && time > now.getTime())
    .sort((a, b) => a - b)[0];

  if (!nextDue) return "先学新词";

  const days = Math.ceil((nextDue - now.getTime()) / 86_400_000);
  if (days <= 1) return "明天复习";
  return `${days} 天后复习`;
}

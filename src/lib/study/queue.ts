import type { CardProgress } from "@/lib/scheduler/scheduler";
import {
  compareCoreVocabulary,
  compareExamFocusVocabulary,
  isCoreVocabularyCard,
  isExamFocusVocabularyCard,
} from "@/lib/vocabulary/core";
import type { VocabularyCard } from "@/lib/vocabulary/types";

type QueueOptions = {
  now?: Date;
  dailyGoal: number;
  mode?: StudyMode;
  favoriteIds?: string[];
};

export type StudyMode = "daily" | "difficult" | "core" | "exam" | "favorites";

export function buildStudyQueue(
  cards: VocabularyCard[],
  progress: Record<string, CardProgress>,
  options: QueueOptions,
): VocabularyCard[] {
  const now = options.now ?? new Date();
  const limit = Math.max(options.dailyGoal, 0);
  const mode = options.mode ?? "daily";

  if (mode === "difficult") {
    return cards
      .filter((card) => getReviewPriority(progress[card.id]) > 0)
      .sort((a, b) => getReviewPriority(progress[b.id]) - getReviewPriority(progress[a.id]))
      .slice(0, limit);
  }

  if (mode === "favorites") {
    const favoriteIds = new Set(options.favoriteIds ?? []);
    return cards
      .filter((card) => favoriteIds.has(card.id))
      .sort((a, b) => getFavoritePriority(progress[b.id]) - getFavoritePriority(progress[a.id]))
      .slice(0, limit);
  }

  if (mode === "core") {
    const coreCards = cards.filter(isCoreVocabularyCard);
    const dueReviews = coreCards.filter((card) => {
      const cardProgress = progress[card.id];
      return cardProgress ? new Date(cardProgress.dueAt).getTime() <= now.getTime() : false;
    }).sort((a, b) => (
      getReviewPriority(progress[b.id]) - getReviewPriority(progress[a.id])
      || compareCoreVocabulary(a, b)
    ));
    const remainingNewSlots = Math.max(limit - dueReviews.length, 0);
    const newCards = coreCards
      .filter((card) => !progress[card.id])
      .sort(compareCoreVocabulary)
      .slice(0, remainingNewSlots);

    return [...dueReviews, ...newCards].slice(0, limit);
  }

  if (mode === "exam") {
    const examCards = cards.filter(isExamFocusVocabularyCard);
    const dueReviews = examCards.filter((card) => {
      const cardProgress = progress[card.id];
      return cardProgress ? new Date(cardProgress.dueAt).getTime() <= now.getTime() : false;
    }).sort((a, b) => (
      getReviewPriority(progress[b.id]) - getReviewPriority(progress[a.id])
      || compareExamFocusVocabulary(a, b)
    ));
    const remainingNewSlots = Math.max(limit - dueReviews.length, 0);
    const newCards = examCards
      .filter((card) => !progress[card.id])
      .sort(compareExamFocusVocabulary)
      .slice(0, remainingNewSlots);

    return [...dueReviews, ...newCards].slice(0, limit);
  }

  const dueReviews = cards.filter((card) => {
    const cardProgress = progress[card.id];
    return cardProgress ? new Date(cardProgress.dueAt).getTime() <= now.getTime() : false;
  }).sort((a, b) => getReviewPriority(progress[b.id]) - getReviewPriority(progress[a.id]));
  const remainingNewSlots = Math.max(limit - dueReviews.length, 0);
  const newCards = cards
    .filter((card) => !progress[card.id])
    .sort(compareCoreVocabulary)
    .slice(0, remainingNewSlots);

  return [...dueReviews, ...newCards];
}

function getReviewPriority(progress: CardProgress | undefined): number {
  if (!progress) return 0;

  return progress.unknownCount * 3 + progress.fuzzyCount * 2 + (progress.status === "learning" ? 1 : 0);
}

function getFavoritePriority(progress: CardProgress | undefined): number {
  if (!progress) return 1_000;

  return getReviewPriority(progress) + (progress.status === "learning" ? 100 : 0);
}

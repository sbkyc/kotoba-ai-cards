export type ReviewRating = "known" | "fuzzy" | "unknown";

export type CardProgress = {
  status: "new" | "learning" | "known";
  ease: number;
  intervalDays: number;
  dueAt: string;
  lastReviewedAt?: string;
  reviewCount: number;
  knownCount: number;
  fuzzyCount: number;
  unknownCount: number;
};

export type ReviewPreview = {
  intervalDays: number;
  dueAt: string;
  label: string;
};

export const defaultProgress: CardProgress = {
  status: "new",
  ease: 2.5,
  intervalDays: 0,
  dueAt: new Date(0).toISOString(),
  reviewCount: 0,
  knownCount: 0,
  fuzzyCount: 0,
  unknownCount: 0,
};

export function scheduleReview(previous: CardProgress | undefined, rating: ReviewRating, now = new Date()): CardProgress {
  const base = previous ?? defaultProgress;
  const next: CardProgress = { ...base };

  next.reviewCount += 1;
  next.lastReviewedAt = now.toISOString();

  if (rating === "known") {
    next.knownCount += 1;
    next.status = "known";
    next.ease = Math.min(next.ease + 0.15, 3);
    next.intervalDays = Math.max(3, Math.ceil((base.intervalDays || 1) * next.ease));
  }

  if (rating === "fuzzy") {
    next.fuzzyCount += 1;
    next.status = "learning";
    next.ease = Math.max(next.ease - 0.1, 1.3);
    next.intervalDays = 1;
  }

  if (rating === "unknown") {
    next.unknownCount += 1;
    next.status = "learning";
    next.ease = Math.max(next.ease - 0.25, 1.3);
    next.intervalDays = 0;
  }

  const due = new Date(now);
  due.setDate(due.getDate() + next.intervalDays);
  next.dueAt = due.toISOString();

  return next;
}

export function previewReview(previous: CardProgress | undefined, rating: ReviewRating, now = new Date()): ReviewPreview {
  const next = scheduleReview(previous ? { ...previous } : undefined, rating, now);
  return {
    intervalDays: next.intervalDays,
    dueAt: next.dueAt,
    label: formatInterval(next.intervalDays),
  };
}

function formatInterval(intervalDays: number): string {
  if (intervalDays === 0) return "今天";
  if (intervalDays === 1) return "明天";
  return `${intervalDays}天后`;
}

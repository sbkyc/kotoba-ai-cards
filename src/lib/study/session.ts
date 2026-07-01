import type { ReviewRating } from "@/lib/scheduler/scheduler";

type NextIndexInput = {
  previousIndex: number;
  nextQueueLength: number;
};

export type SessionStats = {
  completed: number;
  known: number;
  fuzzy: number;
  unknown: number;
};

export function getNextQueueIndexAfterRating(input: NextIndexInput): number {
  void input;
  return 0;
}

export function recordSessionRating(stats: SessionStats, rating: ReviewRating): SessionStats {
  return {
    ...stats,
    completed: stats.completed + 1,
    [rating]: stats[rating] + 1,
  };
}

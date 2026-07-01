import type { ReviewRating } from "@/lib/scheduler/scheduler";

export type StudyCommand = "reveal" | "favorite" | ReviewRating;

export function mapStudyKey(key: string, revealed: boolean): StudyCommand | null {
  const normalized = key.toLowerCase();

  if (key === " ") return "reveal";
  if (normalized === "f") return "favorite";
  if (!revealed) return null;
  if (key === "1") return "unknown";
  if (key === "2") return "fuzzy";
  if (key === "3") return "known";
  return null;
}

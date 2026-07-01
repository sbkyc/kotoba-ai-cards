import type { StudyLevel } from "@/lib/vocabulary/types";
import type { AiProvider } from "@/lib/ai/providers";

export type AppSettings = {
  level: StudyLevel;
  dailyGoal: number;
  aiEnabled: boolean;
  provider: AiProvider;
  apiKey: string;
  model: string;
  endpoint: string;
};

export const defaultSettings: AppSettings = {
  level: "CET4",
  dailyGoal: 10,
  aiEnabled: false,
  provider: "openai",
  apiKey: "",
  model: "gpt-5.5",
  endpoint: "https://api.openai.com/v1/responses",
};

import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/settings/settings";
import { useStudyStore } from "./useStudyStore";

describe("useStudyStore", () => {
  beforeEach(() => {
    useStudyStore.setState({
      settings: defaultSettings,
      progress: {},
      favorites: [],
      reviewEvents: [],
      practiceSessions: [],
    });
  });

  it("clears study progress and review history while keeping settings and favorites", () => {
    useStudyStore.setState({
      settings: { ...defaultSettings, dailyGoal: 12 },
      progress: {
        "n2-test": {
          status: "learning",
          ease: 2.2,
          intervalDays: 1,
          dueAt: "2026-06-17T00:00:00.000Z",
          reviewCount: 2,
          knownCount: 0,
          fuzzyCount: 1,
          unknownCount: 1,
        },
      },
      favorites: ["n2-test"],
      reviewEvents: [{ cardId: "n2-test", rating: "unknown", reviewedAt: "2026-06-16T00:00:00.000Z" }],
      practiceSessions: [
        {
          id: "practice-1",
          level: "N2",
          title: "N2 错题专项",
          takenAt: "2026-06-16T00:00:00.000Z",
          total: 2,
          correct: 1,
          accuracy: 50,
          weakCardIds: ["n2-test"],
        },
      ],
    });

    useStudyStore.getState().clearProgress();

    expect(useStudyStore.getState().progress).toEqual({});
    expect(useStudyStore.getState().reviewEvents).toEqual([]);
    expect(useStudyStore.getState().practiceSessions).toEqual([]);
    expect(useStudyStore.getState().favorites).toEqual(["n2-test"]);
    expect(useStudyStore.getState().settings.dailyGoal).toBe(12);
  });

  it("records recent practice sessions and keeps the newest 30", () => {
    for (let index = 0; index < 31; index += 1) {
      useStudyStore.getState().recordPracticeSession({
        id: `practice-${index}`,
        level: "CET4",
        title: `Session ${index}`,
        takenAt: `2026-06-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
        total: 10,
        correct: index % 10,
        accuracy: index,
        weakCardIds: [`card-${index}`],
      });
    }

    const sessions = useStudyStore.getState().practiceSessions;

    expect(sessions).toHaveLength(30);
    expect(sessions[0].id).toBe("practice-1");
    expect(sessions.at(-1)?.id).toBe("practice-30");
  });
});

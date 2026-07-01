import { describe, expect, it } from "vitest";
import { getStudyLevelMeta, getVocabularyByLevel, studyLevels, vocabularyCards } from "./data";

describe("vocabulary data", () => {
  it("loads both CET and JLPT study levels", () => {
    expect(studyLevels.map((level) => level.value)).toEqual(["CET4", "CET6", "N5", "N4", "N3", "N2", "N1"]);
    expect(getVocabularyByLevel("CET4").length).toBeGreaterThan(2500);
    expect(getVocabularyByLevel("CET6").length).toBeGreaterThan(2000);
    expect(getVocabularyByLevel("N5").length).toBeGreaterThan(500);
    expect(getVocabularyByLevel("N4").length).toBeGreaterThan(500);
    expect(getVocabularyByLevel("N3").length).toBeGreaterThan(1000);
    expect(getVocabularyByLevel("N2").length).toBeGreaterThan(1000);
    expect(getVocabularyByLevel("N1").length).toBeGreaterThan(3000);
  });

  it("keeps generated vocabulary ids unique", () => {
    const ids = vocabularyCards.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("derives usable parts of speech for generated CET decks", () => {
    const cetParts = new Set(
      [...getVocabularyByLevel("CET4"), ...getVocabularyByLevel("CET6")].map((card) => card.partOfSpeech),
    );

    expect([...cetParts].some((part) => part.includes("noun"))).toBe(true);
    expect([...cetParts].some((part) => part.includes("verb"))).toBe(true);
    expect([...cetParts].some((part) => part.includes("adjective"))).toBe(true);
  });

  it("keeps CET word forms from the source dictionary as related words", () => {
    const abandon = getVocabularyByLevel("CET4").find((card) => card.word === "abandon");

    expect(abandon?.relatedWords).toEqual(expect.arrayContaining(["abandoned", "abandoning", "abandons"]));
  });

  it("exposes display metadata for English and Japanese decks", () => {
    expect(getStudyLevelMeta("CET4")).toMatchObject({
      label: "CET-4",
      family: "英语四级",
      readingLabel: "发音",
      exampleLabel: "英文例句",
    });
    expect(getStudyLevelMeta("N1")).toMatchObject({
      label: "JLPT N1",
      family: "日语 N1",
      readingLabel: "假名",
      exampleLabel: "日语例句",
    });
  });
});

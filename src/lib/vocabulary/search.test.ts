import { describe, expect, it } from "vitest";
import { filterVocabulary } from "./search";
import type { VocabularyCard } from "./types";

const cards: VocabularyCard[] = [
  {
    id: "n2-houshin",
    level: "N2",
    word: "houshin",
    kana: "houshin",
    meaningZh: "policy direction",
    partOfSpeech: "noun",
    exampleJa: "The company announced a new policy direction.",
    exampleZh: "The company announced a new policy direction.",
    tags: ["business", "abstract"],
    relatedWords: ["method", "direction"],
  },
  {
    id: "n1-gainen",
    level: "N1",
    word: "gainen",
    kana: "gainen",
    meaningZh: "concept",
    partOfSpeech: "noun",
    exampleJa: "You need to understand that concept precisely.",
    exampleZh: "You need to understand that concept precisely.",
    tags: ["abstract"],
  },
  {
    id: "cet4-abandon",
    level: "CET4",
    word: "abandon",
    kana: "/uh-ban-duhn/",
    meaningZh: "give up",
    partOfSpeech: "verb",
    exampleJa: "Do not abandon your plan too early.",
    exampleZh: "Do not abandon your plan too early.",
    tags: ["core", "verb"],
    relatedWords: ["quit", "desert"],
  },
  {
    id: "n3-ah",
    level: "N3",
    word: "あっ",
    kana: "あっ",
    meaningZh: "Ah!,Oh!",
    partOfSpeech: "vocabulary",
    exampleJa: "",
    exampleZh: "",
    tags: ["jlpt"],
  },
];

describe("filterVocabulary", () => {
  it("filters by study level", () => {
    expect(filterVocabulary(cards, { level: "N2" }).map((card) => card.id)).toEqual(["n2-houshin"]);
  });

  it("searches by word, kana, and meaning", () => {
    expect(filterVocabulary(cards, { query: "houshin" }).map((card) => card.id)).toEqual(["n2-houshin"]);
    expect(filterVocabulary(cards, { query: "gainen" }).map((card) => card.id)).toEqual(["n1-gainen"]);
    expect(filterVocabulary(cards, { query: "direction" }).map((card) => card.id)).toEqual(["n2-houshin"]);
  });

  it("filters by part of speech and tag", () => {
    expect(filterVocabulary(cards, { partOfSpeech: "noun", tag: "business" }).map((card) => card.id)).toEqual([
      "n2-houshin",
    ]);
  });

  it("searches tags, related words, and examples", () => {
    expect(filterVocabulary(cards, { query: "core" }).map((card) => card.id)).toEqual(["cet4-abandon"]);
    expect(filterVocabulary(cards, { query: "desert" }).map((card) => card.id)).toEqual(["cet4-abandon"]);
    expect(filterVocabulary(cards, { query: "plan too early" }).map((card) => card.id)).toEqual(["cet4-abandon"]);
  });

  it("searches reviewed Chinese display meanings while keeping source gloss searchable", () => {
    expect(filterVocabulary(cards, { query: "啊" }).map((card) => card.id)).toEqual(["n3-ah"]);
    expect(filterVocabulary(cards, { query: "Ah" }).map((card) => card.id)).toEqual(["n3-ah"]);
  });
});

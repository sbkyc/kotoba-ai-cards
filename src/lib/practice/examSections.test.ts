import { describe, expect, it } from "vitest";
import { findExamSection, getDefaultExamSection, getExamSections } from "./examSections";

describe("exam practice sections", () => {
  it("provides CET sections that mirror real exam skill modules", () => {
    const sections = getExamSections("CET4");

    expect(sections.map((section) => section.id)).toEqual([
      "cet-vocabulary-context",
      "cet-cloze",
      "cet-reading-meaning",
      "cet-translation-usage",
    ]);
    expect(sections[0].promptInstruction).toContain("____");
  });

  it("provides JLPT sections for vocabulary, grammar, reading, and paraphrase", () => {
    const sections = getExamSections("N2");

    expect(sections.map((section) => section.id)).toEqual([
      "jlpt-moji-goi",
      "jlpt-grammar",
      "jlpt-reading-context",
      "jlpt-paraphrase",
    ]);
    expect(sections[0].promptInstruction).toContain("（　）");
  });

  it("resolves default and fallback sections by level", () => {
    expect(getDefaultExamSection("CET6").id).toBe("cet-vocabulary-context");
    expect(findExamSection("N1", "missing").id).toBe("jlpt-moji-goi");
    expect(findExamSection("CET4", "cet-cloze").label).toBe("完形填空");
  });
});

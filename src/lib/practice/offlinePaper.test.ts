import { describe, expect, it } from "vitest";
import { findExamSection } from "@/lib/practice/examSections";
import type { VocabularyCard } from "@/lib/vocabulary/types";
import { buildOfflineExamQuizPayload, buildOfflinePracticePaper } from "./offlinePaper";

describe("offline practice paper", () => {
  it("generates complete four-option questions tied to the selected source cards", () => {
    const paper = buildOfflinePracticePaper(englishCards, {
      questionCount: 3,
      examSection: findExamSection("CET4", "cet-vocabulary-context"),
    });

    expect(paper).toMatchObject({
      kind: "practice-paper",
      title: "CET 词汇语境 · 离线小测",
    });
    expect(paper.questions).toHaveLength(3);

    for (const [index, question] of paper.questions.entries()) {
      expect(question.cardId).toBe(englishCards[index].id);
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.answer);
      expect(question.examSection).toBe("CET 词汇语境");
      expect(question.questionType).toBe("离线原创四选一");
    }
  });

  it("uses CET-style blank stems for vocabulary context modules", () => {
    const paper = buildOfflinePracticePaper(englishCards, {
      questionCount: 1,
      examSection: findExamSection("CET4", "cet-cloze"),
    });

    expect(paper.questions[0].stem).toContain("____");
    expect(paper.questions[0].skill).toBe("完形填空");
  });

  it("uses JLPT-style Japanese blanks for moji-goi modules", () => {
    const paper = buildOfflinePracticePaper(japaneseCards, {
      questionCount: 1,
      examSection: findExamSection("N3", "jlpt-moji-goi"),
    });

    expect(paper.title).toBe("JLPT 文字語彙 · 离线小测");
    expect(paper.questions[0].stem).toContain("（　）");
    expect(paper.questions[0].examSection).toBe("JLPT 文字語彙");
  });

  it("uses reviewed Chinese meanings for JLPT imported English glosses", () => {
    const paper = buildOfflinePracticePaper(japaneseSourceGlossCards, {
      questionCount: 1,
      examSection: findExamSection("N3", "jlpt-reading-context"),
    });

    expect(paper.questions[0].options).toContain("A 啊！哦！");
    expect(paper.questions[0].explanation).toContain("啊！哦！");
    expect(paper.questions[0].explanation).toContain("英文释义：Ah!,Oh!");
  });

  it("falls back to stable synthetic distractors when the deck is too small", () => {
    const paper = buildOfflinePracticePaper(englishCards.slice(0, 1), {
      questionCount: 1,
      examSection: findExamSection("CET4", "cet-reading-meaning"),
    });

    expect(paper.questions[0].options).toHaveLength(4);
    expect(new Set(paper.questions[0].options).size).toBe(4);
    expect(paper.questions[0].stem).toContain("meaning is closest to");
  });

  it("uses a definition-clue fallback instead of a generic target-word sentence", () => {
    const paper = buildOfflinePracticePaper([makeCard("cet-4-brief", "CET4", "brief", "简短的；摘要", "adj.", "", "")], {
      questionCount: 1,
      examSection: findExamSection("CET4", "cet-vocabulary-context"),
    });

    expect(paper.questions[0].stem).toContain("____");
    expect(paper.questions[0].stem).toContain("简短的；摘要");
    expect(paper.questions[0].stem).not.toContain("The target word is");
  });

  it("builds a single-card offline exam quiz payload for study cards", () => {
    const payload = buildOfflineExamQuizPayload(englishCards[0], englishCards, findExamSection("CET4", "cet-cloze"));

    expect(payload).toMatchObject({
      kind: "exam-quiz",
      examSection: "CET 完形填空",
      questionType: "离线原创四选一",
      answer: expect.stringContaining("abandon"),
    });
    expect(payload.options).toHaveLength(4);
    expect(payload.question).toContain("____");
  });
});

const englishCards: VocabularyCard[] = [
  makeCard("cet-4-abandon", "CET4", "abandon", "放弃；抛弃", "v.", "The team had to abandon the old plan.", "团队不得不放弃旧计划。"),
  makeCard("cet-4-ability", "CET4", "ability", "能力；才能", "n.", "She has the ability to solve it.", "她有能力解决它。"),
  makeCard("cet-4-benefit", "CET4", "benefit", "好处；使受益", "n./v.", "The policy will benefit students.", "这项政策会使学生受益。"),
  makeCard("cet-4-maintain", "CET4", "maintain", "维持；保持", "v.", "They maintain a steady pace.", "他们保持稳定节奏。"),
];

const japaneseCards: VocabularyCard[] = [
  makeCard("jlpt-n3-安心", "N3", "安心", "安心；放心", "名/する", "家族に連絡して安心しました。", "联系家人后放心了。", "あんしん"),
  makeCard("jlpt-n3-予定", "N3", "予定", "预定；计划", "名", "明日の予定を確認します。", "确认明天的计划。", "よてい"),
  makeCard("jlpt-n3-必要", "N3", "必要", "必要", "名/な形", "予約が必要です。", "需要预约。", "ひつよう"),
  makeCard("jlpt-n3-連絡", "N3", "連絡", "联系", "名/する", "先生に連絡します。", "联系老师。", "れんらく"),
];

const japaneseSourceGlossCards: VocabularyCard[] = [
  makeCard("n3-2394370", "N3", "あっ", "Ah!,Oh!", "vocabulary", "", "", "あっ"),
  makeCard("n3-1582850", "N3", "会う", "to meet", "vocabulary", "", "", "あう"),
  makeCard("n3-1560670", "N3", "青い", "blue", "vocabulary", "", "", "あおい"),
  makeCard("n3-1577980", "N3", "安全", "safety", "vocabulary", "", "", "あんぜん"),
];

function makeCard(
  id: string,
  level: VocabularyCard["level"],
  word: string,
  meaningZh: string,
  partOfSpeech: string,
  exampleJa: string,
  exampleZh: string,
  kana = "",
): VocabularyCard {
  return {
    id,
    level,
    word,
    kana,
    meaningZh,
    partOfSpeech,
    exampleJa,
    exampleZh,
    tags: [],
  };
}

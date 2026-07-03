import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VocabularyCardView } from "./VocabularyCard";
import type { VocabularyCard } from "@/lib/vocabulary/types";

const card: VocabularyCard = {
  id: "n2-houshin",
  level: "N2",
  word: "houshin",
  kana: "houshin",
  meaningZh: "policy direction",
  partOfSpeech: "noun",
  exampleJa: "The company announced a new policy direction.",
  exampleZh: "The company announced a new policy direction.",
  tags: ["business", "abstract"],
};

const jlptSourceGlossCard: VocabularyCard = {
  id: "n3-2394370",
  level: "N3",
  word: "あっ",
  kana: "あっ",
  meaningZh: "Ah!,Oh!",
  partOfSpeech: "vocabulary",
  exampleJa: "",
  exampleZh: "",
  tags: ["jlpt", "n3"],
};

describe("VocabularyCardView", () => {
  it("lets learners rate directly without revealing first", () => {
    const onRate = vi.fn();

    render(<VocabularyCardView card={card} onRate={onRate} />);

    expect(screen.getAllByText("houshin")).toHaveLength(2);
    expect(screen.queryByText("policy direction")).not.toBeInTheDocument();

    const unknownButton = screen.getByRole("button", { name: "不认识" });
    const fuzzyButton = screen.getByRole("button", { name: "模糊" });
    const knownButton = screen.getByRole("button", { name: "认识" });
    expect(unknownButton).toBeEnabled();
    expect(fuzzyButton).toBeEnabled();
    expect(knownButton).toBeEnabled();

    fireEvent.click(unknownButton);

    expect(onRate).toHaveBeenCalledWith("unknown");
  });

  it("omits the example block when a generated vocabulary entry has no example", () => {
    const { container } = render(
      <VocabularyCardView card={{ ...card, exampleJa: "", exampleZh: "" }} onRate={vi.fn()} revealed />,
    );

    expect(screen.getByText("policy direction")).toBeInTheDocument();
    expect(container.querySelector(".example-block")).toBeNull();
  });

  it("shows reviewed Chinese display meanings for JLPT source glosses", () => {
    render(<VocabularyCardView card={jlptSourceGlossCard} onRate={vi.fn()} revealed />);

    expect(screen.getByText("中文释义")).toBeInTheDocument();
    expect(screen.getByText("啊！哦！")).toBeInTheDocument();
    expect(screen.getByText("英文释义：Ah!,Oh!")).toBeInTheDocument();
  });

  it("keeps unreviewed JLPT source glosses explicitly labelled as English", () => {
    render(<VocabularyCardView card={{ ...card, meaningZh: "rare imported source gloss" }} onRate={vi.fn()} revealed />);

    expect(screen.getByText("英文释义")).toBeInTheDocument();
    expect(screen.getByText("rare imported source gloss")).toBeInTheDocument();
    expect(screen.queryByText("中文释义")).not.toBeInTheDocument();
  });

  it("labels CET imported meanings as Chinese meanings", () => {
    render(<VocabularyCardView card={{ ...card, level: "CET4", meaningZh: "政策方向" }} onRate={vi.fn()} revealed />);

    expect(screen.getByText("中文释义")).toBeInTheDocument();
  });

  it("keeps study tools visible before the answer is revealed", () => {
    render(
      <VocabularyCardView card={card} onRate={vi.fn()}>
        <button type="button">AI 刷题</button>
      </VocabularyCardView>,
    );

    expect(screen.getByRole("button", { name: "AI 刷题" })).toBeInTheDocument();
    expect(screen.queryByText("policy direction")).not.toBeInTheDocument();
  });

  it("scrolls the answer into view after revealing on a compact screen", () => {
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    render(<VocabularyCardView card={jlptSourceGlossCard} onRate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "显示释义" }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
  });

  it("shows vocabulary source evidence when provided", () => {
    render(
      <VocabularyCardView
        card={card}
        onRate={vi.fn()}
        evidence={{
          sourceBadges: [{ label: "ECDICT CET-4", detail: "source" }],
          recommendationBadges: ["常考词"],
          reason: "命中来源标签。",
          caution: "不等同于真题频次统计。",
        }}
      />,
    );

    expect(screen.getByText("常考词")).toBeInTheDocument();
    expect(screen.getByText("ECDICT CET-4")).toBeInTheDocument();
    expect(screen.getByText("命中来源标签。")).toBeInTheDocument();
  });
});

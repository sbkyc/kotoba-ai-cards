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

  it("keeps study tools visible before the answer is revealed", () => {
    render(
      <VocabularyCardView card={card} onRate={vi.fn()}>
        <button type="button">AI 刷题</button>
      </VocabularyCardView>,
    );

    expect(screen.getByRole("button", { name: "AI 刷题" })).toBeInTheDocument();
    expect(screen.queryByText("policy direction")).not.toBeInTheDocument();
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

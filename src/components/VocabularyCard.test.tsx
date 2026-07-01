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
  it("keeps rating controls disabled until the answer is revealed", () => {
    render(<VocabularyCardView card={card} onRate={vi.fn()} />);

    expect(screen.getAllByText("houshin")).toHaveLength(2);
    expect(screen.queryByText("policy direction")).not.toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    const ratingButtons = buttons.slice(-3);
    ratingButtons.forEach((button) => expect(button).toBeDisabled());

    fireEvent.click(buttons[0]);

    expect(screen.getByText("policy direction")).toBeInTheDocument();
    ratingButtons.forEach((button) => expect(button).toBeEnabled());
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
});

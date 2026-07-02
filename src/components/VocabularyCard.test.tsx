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

    const unknownButton = screen.getByRole("button", { name: "???" });
    const fuzzyButton = screen.getByRole("button", { name: "??" });
    const knownButton = screen.getByRole("button", { name: "??" });
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

  it("labels JLPT imported meanings as English glosses", () => {
    render(<VocabularyCardView card={card} onRate={vi.fn()} revealed />);

    expect(screen.getByText("????")).toBeInTheDocument();
    expect(screen.queryByText("????")).not.toBeInTheDocument();
  });

  it("labels CET imported meanings as Chinese meanings", () => {
    render(<VocabularyCardView card={{ ...card, level: "CET4", meaningZh: "????" }} onRate={vi.fn()} revealed />);

    expect(screen.getByText("????")).toBeInTheDocument();
  });

  it("keeps study tools visible before the answer is revealed", () => {
    render(
      <VocabularyCardView card={card} onRate={vi.fn()}>
        <button type="button">AI ??</button>
      </VocabularyCardView>,
    );

    expect(screen.getByRole("button", { name: "AI ??" })).toBeInTheDocument();
    expect(screen.queryByText("policy direction")).not.toBeInTheDocument();
  });

  it("shows vocabulary source evidence when provided", () => {
    render(
      <VocabularyCardView
        card={card}
        onRate={vi.fn()}
        evidence={{
          sourceBadges: [{ label: "ECDICT CET-4", detail: "source" }],
          recommendationBadges: ["???"],
          reason: "???????",
          caution: "???????????",
        }}
      />,
    );

    expect(screen.getByText("???")).toBeInTheDocument();
    expect(screen.getByText("ECDICT CET-4")).toBeInTheDocument();
    expect(screen.getByText("???????")).toBeInTheDocument();
  });
});

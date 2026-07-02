import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiPanel } from "./AiPanel";

describe("AiPanel", () => {
  it("uses a cat loading indicator while AI is generating", () => {
    render(
      <AiPanel
        loading
        error=""
        payload={null}
        aiEnabled
        revealed={false}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("?????")).toBeInTheDocument();
    expect(screen.getByText("??????")).toBeInTheDocument();
  });

  it("shows the exam quiz action by default and gates answer-revealing helpers", () => {
    render(
      <AiPanel
        loading={false}
        error=""
        payload={null}
        aiEnabled
        revealed={false}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "AI ??" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "????" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "????" })).toBeDisabled();
  });

  it("keeps local quiz available when AI is not configured", () => {
    render(
      <AiPanel
        loading={false}
        error=""
        payload={null}
        aiEnabled={false}
        revealed={false}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "????" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "????" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "????" })).toBeDisabled();
    expect(screen.getByText(/??? API Key/)).toBeInTheDocument();
  });

  it("hides exam quiz answers until the learner reveals them", () => {
    render(
      <AiPanel
        loading={false}
        error=""
        payload={{
          kind: "exam-quiz",
          examSection: "CET vocabulary in context",
          questionType: "cloze choice",
          question: "The team had to ____ the plan.",
          options: ["A abandon", "B obtain", "C maintain", "D contain"],
          answer: "A abandon",
          explanation: "abandon means give up.",
          memoryCheck: "If you chose C, review meaning and collocation.",
        }}
        aiEnabled
        revealed
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByText("The team had to ____ the plan.")).toBeInTheDocument();
    expect(screen.getByText("A abandon")).toBeInTheDocument();
    expect(screen.queryByText("abandon means give up.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "???????" }));

    expect(screen.getByText("abandon means give up.")).toBeInTheDocument();
  });

  it("lets learners record an exam quiz result after revealing the answer", () => {
    const onQuizRate = vi.fn();

    render(
      <AiPanel
        loading={false}
        error=""
        payload={{
          kind: "exam-quiz",
          examSection: "CET vocabulary in context",
          questionType: "cloze choice",
          question: "The team had to ____ the plan.",
          options: ["A abandon", "B obtain", "C maintain", "D contain"],
          answer: "A abandon",
          explanation: "abandon means give up.",
        }}
        aiEnabled
        revealed={false}
        onAction={vi.fn()}
        onQuizRate={onQuizRate}
      />,
    );

    expect(screen.queryByRole("button", { name: "???" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "???????" }));
    fireEvent.click(screen.getByRole("button", { name: "???" }));

    expect(onQuizRate).toHaveBeenCalledWith("known");
  });
});

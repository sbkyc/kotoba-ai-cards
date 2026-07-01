import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiPanel } from "./AiPanel";

describe("AiPanel", () => {
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

    expect(screen.getByRole("button", { name: "AI 刷题" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "生成例句" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "解释区别" })).toBeDisabled();
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

    fireEvent.click(screen.getByRole("button", { name: "显示答案和解析" }));

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

    expect(screen.queryByRole("button", { name: "答对了" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "显示答案和解析" }));
    fireEvent.click(screen.getByRole("button", { name: "答对了" }));

    expect(onQuizRate).toHaveBeenCalledWith("known");
  });
});

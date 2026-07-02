import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudyModeTabs } from "./StudyModeTabs";

describe("StudyModeTabs", () => {
  it("shows study modes and reports selection changes", () => {
    const onChange = vi.fn();

    render(<StudyModeTabs value="daily" onChange={onChange} />);

    expect(screen.getByRole("button", { name: "今日计划" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "错题优先" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "核心词" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "常考词" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重点词" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "常考词" }));

    expect(onChange).toHaveBeenCalledWith("exam");
  });
});

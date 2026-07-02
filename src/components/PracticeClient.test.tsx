import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@/lib/settings/settings";
import { useStudyStore } from "@/store/useStudyStore";
import { PracticeClient } from "./PracticeClient";

vi.mock("next/navigation", () => ({
  usePathname: () => "/practice",
}));

describe("PracticeClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    useStudyStore.setState({
      settings: { ...defaultSettings, level: "CET4", aiEnabled: false, apiKey: "" },
      progress: {},
      favorites: [],
      reviewEvents: [],
      practiceSessions: [],
    });
  });

  it("lets learners generate an offline paper without an API key", async () => {
    render(<PracticeClient />);

    const generateButton = screen.getByRole("button", { name: /生成专项小测/ });
    expect(generateButton).toBeEnabled();

    fireEvent.click(generateButton);

    expect(await screen.findByText("CET 词汇语境 · 离线小测")).toBeInTheDocument();
    expect(screen.getByText(/当前使用离线组卷/)).toBeInTheDocument();
    expect(screen.getAllByText(/离线原创四选一/)).toHaveLength(10);
  });
});

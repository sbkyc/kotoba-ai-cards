import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@/lib/settings/settings";
import { useStudyStore } from "@/store/useStudyStore";
import { StudyClient } from "./StudyClient";

vi.mock("next/navigation", () => ({
  usePathname: () => "/study",
}));

describe("StudyClient", () => {
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

  it("generates a local single-card quiz without an API key", async () => {
    render(<StudyClient />);

    fireEvent.click(screen.getByRole("button", { name: "????" }));

    expect(await screen.findByText("???????")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "???????" })).toBeInTheDocument();
  });
});

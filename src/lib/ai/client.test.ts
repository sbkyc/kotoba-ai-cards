import { afterEach, describe, expect, it, vi } from "vitest";
import { parseAiPayload, requestAiJson } from "./client";

describe("parseAiPayload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses JSON from a Responses API output_text field", () => {
    expect(parseAiPayload({ output_text: "{\"exampleJa\":\"今日は方針を確認した。\"}" })).toEqual({
      exampleJa: "今日は方針を確認した。",
    });
  });

  it("returns raw text when the model does not return JSON", () => {
    expect(parseAiPayload({ output_text: "plain explanation" })).toEqual({
      raw: "plain explanation",
    });
  });

  it("repairs common AI JSON wrappers before falling back to raw text", () => {
    expect(parseAiPayload({ output_text: "```json\n{\"answer\":\"A\"}\n```" })).toEqual({ answer: "A" });
    expect(parseAiPayload({ output_text: "好的，结果如下：\n{\"kind\":\"practice-paper\",\"questions\":[]}\n祝你学习顺利。" })).toEqual({
      kind: "practice-paper",
      questions: [],
    });
  });

  it("requests OpenAI-compatible chat completion providers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "{\"question\":\"ok\"}" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestAiJson("make quiz", {
        provider: "deepseek",
        apiKey: "deepseek-key",
        model: "deepseek-chat",
        endpoint: "https://api.deepseek.com/chat/completions",
      }),
    ).resolves.toEqual({ question: "ok" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer deepseek-key" }),
        body: expect.stringContaining("\"messages\""),
      }),
    );
  });

  it("requests Gemini generateContent providers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "{\"answer\":\"A\"}" }] } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestAiJson("make quiz", {
        provider: "gemini",
        apiKey: "gemini-key",
        model: "gemini-2.5-flash",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
      }),
    ).resolves.toEqual({ answer: "A" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-goog-api-key": "gemini-key" }),
        body: expect.stringContaining("\"responseMimeType\":\"application/json\""),
      }),
    );
  });

  it("requests Anthropic messages providers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "{\"explanation\":\"ok\"}" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestAiJson("make quiz", {
        provider: "anthropic",
        apiKey: "anthropic-key",
        model: "claude-sonnet-4-5",
        endpoint: "https://api.anthropic.com/v1/messages",
      }),
    ).resolves.toEqual({ explanation: "ok" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "anthropic-version": "2023-06-01",
          "x-api-key": "anthropic-key",
        }),
        body: expect.stringContaining("\"max_tokens\""),
      }),
    );
  });
});

export type AiProvider =
  | "openai"
  | "openai-compatible"
  | "deepseek"
  | "qwen"
  | "moonshot"
  | "zhipu"
  | "openrouter"
  | "gemini"
  | "anthropic";

export type AiTransport = "responses" | "chat-completions" | "gemini" | "anthropic";

export type AiProviderPreset = {
  value: AiProvider;
  label: string;
  transport: AiTransport;
  defaultModel: string;
  defaultEndpoint: string;
  keyPlaceholder: string;
};

export const aiProviderPresets: AiProviderPreset[] = [
  {
    value: "openai",
    label: "OpenAI",
    transport: "responses",
    defaultModel: "gpt-5.5",
    defaultEndpoint: "https://api.openai.com/v1/responses",
    keyPlaceholder: "sk-...",
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    transport: "chat-completions",
    defaultModel: "deepseek-chat",
    defaultEndpoint: "https://api.deepseek.com/chat/completions",
    keyPlaceholder: "sk-...",
  },
  {
    value: "qwen",
    label: "通义千问 DashScope",
    transport: "chat-completions",
    defaultModel: "qwen-plus",
    defaultEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    keyPlaceholder: "sk-...",
  },
  {
    value: "moonshot",
    label: "Kimi / Moonshot",
    transport: "chat-completions",
    defaultModel: "moonshot-v1-8k",
    defaultEndpoint: "https://api.moonshot.cn/v1/chat/completions",
    keyPlaceholder: "sk-...",
  },
  {
    value: "zhipu",
    label: "智谱 GLM",
    transport: "chat-completions",
    defaultModel: "glm-4-flash",
    defaultEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    keyPlaceholder: "请输入智谱 API Key",
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    transport: "chat-completions",
    defaultModel: "openai/gpt-4o-mini",
    defaultEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    keyPlaceholder: "sk-or-...",
  },
  {
    value: "gemini",
    label: "Google Gemini",
    transport: "gemini",
    defaultModel: "gemini-2.5-flash",
    defaultEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
    keyPlaceholder: "AIza...",
  },
  {
    value: "anthropic",
    label: "Anthropic Claude",
    transport: "anthropic",
    defaultModel: "claude-sonnet-4-5",
    defaultEndpoint: "https://api.anthropic.com/v1/messages",
    keyPlaceholder: "sk-ant-...",
  },
  {
    value: "openai-compatible",
    label: "自定义 OpenAI-compatible",
    transport: "chat-completions",
    defaultModel: "your-model-name",
    defaultEndpoint: "https://your-api.example.com/v1/chat/completions",
    keyPlaceholder: "Bearer token",
  },
];

const providerPresetMap = new Map(aiProviderPresets.map((preset) => [preset.value, preset]));

export function getAiProviderPreset(provider: AiProvider | undefined): AiProviderPreset {
  return providerPresetMap.get(provider ?? "openai") ?? aiProviderPresets[0];
}

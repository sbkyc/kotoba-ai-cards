"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CheckCircle2, Download, KeyRound, Smartphone, Trash2, Upload } from "lucide-react";
import { aiProviderPresets, getAiProviderPreset, type AiProvider } from "@/lib/ai/providers";
import { createBackup, parseBackup } from "@/lib/backup/backup";
import { getInstallPlatform, getInstallSteps, isStandaloneDisplay, type InstallPlatform } from "@/lib/pwa/install";
import { studyLevels } from "@/lib/vocabulary/data";
import type { StudyLevel } from "@/lib/vocabulary/types";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/store/useStudyStore";

export function SettingsClient() {
  const settings = useStudyStore((state) => state.settings);
  const progress = useStudyStore((state) => state.progress);
  const favorites = useStudyStore((state) => state.favorites);
  const reviewEvents = useStudyStore((state) => state.reviewEvents);
  const practiceSessions = useStudyStore((state) => state.practiceSessions ?? []);
  const updateSettings = useStudyStore((state) => state.updateSettings);
  const restoreBackup = useStudyStore((state) => state.restoreBackup);
  const clearProgress = useStudyStore((state) => state.clearProgress);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const selectedProvider = settings.provider ?? "openai";
  const providerPreset = getAiProviderPreset(selectedProvider);

  const updateAiProvider = (provider: AiProvider) => {
    const preset = getAiProviderPreset(provider);
    updateSettings({
      provider,
      model: preset.defaultModel,
      endpoint: preset.defaultEndpoint,
    });
  };

  const exportBackup = () => {
    const blob = new Blob([createBackup({ settings, progress, favorites, reviewEvents, practiceSessions })], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kotoba-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("本地备份已导出。");
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    restoreBackup(
      result.data.settings,
      result.data.progress,
      result.data.favorites,
      result.data.reviewEvents,
      result.data.practiceSessions,
    );
    setMessage("备份已恢复。");
  };

  const confirmClear = () => {
    if (window.confirm("确定清空全部学习进度吗？重点词和设置不会被删除。")) {
      clearProgress();
      setMessage("学习进度已清空。");
    }
  };

  return (
    <AppShell>
      <div className="page-wrap settings-page">
        <header>
          <p className="eyebrow">Preferences</p>
          <h1 className="page-title">设置</h1>
        </header>

        <SettingsSection title="学习偏好" description="调整默认词库和每日学习量。">
          <SettingRow label="默认考试词库">
            <select value={settings.level} onChange={(event) => updateSettings({ level: event.target.value as StudyLevel })}>
              {studyLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
          </SettingRow>
          <SettingRow label="每日新词目标">
            <input type="number" min={1} max={100} value={settings.dailyGoal} onChange={(event) => updateSettings({ dailyGoal: Number(event.target.value) })} />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="AI 提供商" description="浏览器直连适合个人使用，不要在公共设备保存密钥。">
          <SettingRow label="启用 AI 工具">
            <input type="checkbox" checked={settings.aiEnabled} onChange={(event) => updateSettings({ aiEnabled: event.target.checked })} />
          </SettingRow>
          <SettingRow label="AI 服务商">
            <select value={selectedProvider} onChange={(event) => updateAiProvider(event.target.value as AiProvider)}>
              {aiProviderPresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
            </select>
          </SettingRow>
          <input type="text" autoComplete="username" value={`kotoba-${selectedProvider}`} readOnly hidden aria-hidden="true" />
          <SettingRow label="API Key">
            <div className="inline-control">
              <input type="password" autoComplete="new-password" value={settings.apiKey} onChange={(event) => updateSettings({ apiKey: event.target.value })} placeholder={providerPreset.keyPlaceholder} />
              <button type="button" className="secondary-button" onClick={() => updateSettings({ apiKey: "", aiEnabled: false })}><KeyRound size={15} /> 清除</button>
            </div>
          </SettingRow>
          <SettingRow label="模型">
            <input value={settings.model} onChange={(event) => updateSettings({ model: event.target.value })} />
          </SettingRow>
          <SettingRow label="API Endpoint">
            <input value={settings.endpoint} onChange={(event) => updateSettings({ endpoint: event.target.value })} />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="数据备份" description="导出或恢复本地设置、进度、重点词和学习历史。">
          <div className="action-row">
            <button type="button" className="secondary-button" onClick={exportBackup}><Download size={16} /> 导出 JSON</button>
            <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> 导入 JSON</button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={(event) => void importBackup(event.target.files?.[0])} />
          </div>
        </SettingsSection>

        <SettingsSection title="安装应用" description="把 Kotoba 放到手机主屏幕或电脑桌面，打开时会像独立软件一样运行。">
          <PwaInstallPanel />
        </SettingsSection>

        <SettingsSection title="危险操作" description="操作不可撤销，建议先导出备份。">
          <button type="button" className="danger-button" onClick={confirmClear}><Trash2 size={16} /> 清空学习进度</button>
        </SettingsSection>

        {message ? <p className="settings-message">{message}</p> : null}
      </div>

      <style jsx>{`
        .settings-page { max-width:900px; }
        .inline-control,.action-row { display:flex; gap:8px; }
        input:not([type="checkbox"]),select { width:min(440px,100%); min-height:42px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:0 12px; color:var(--ink); }
        input[type="checkbox"] { width:20px; height:20px; accent-color:var(--green); }
        .danger-button { display:inline-flex; gap:8px; align-items:center; min-height:42px; border:1px solid var(--red); border-radius:6px; background:var(--red-soft); padding:0 15px; color:var(--red); font-weight:700; }
        .settings-message { position:sticky; bottom:20px; width:fit-content; margin-left:auto; border-radius:6px; background:var(--ink); padding:10px 14px; color:white; font-size:12px; }
        @media(max-width:620px) { .inline-control,.action-row { flex-direction:column; } }
      `}</style>
    </AppShell>
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function PwaInstallPanel() {
  const platform = useSyncExternalStore(subscribeInstallPlatform, getBrowserInstallPlatform, getServerInstallPlatform);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const standalone = useSyncExternalStore(subscribeStandaloneDisplay, getBrowserStandaloneDisplay, getServerStandaloneDisplay);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setMessage("");
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstalled(true);
      setMessage("已经安装，可以从主屏幕或桌面打开。");
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      setMessage(platform === "ios" ? "iPhone 上请按下方步骤添加到主屏幕。" : "如果没有安装按钮，请按下方步骤从浏览器菜单安装。");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setMessage(choice.outcome === "accepted" ? "安装已开始。" : "已取消安装，可以稍后再试。");
  };

  const steps = getInstallSteps(platform);

  return (
    <div className="install-panel">
      <div className="install-head">
        <div>
          <strong>{standalone || installed ? "已在应用模式运行" : "安装 Kotoba"}</strong>
          <p>{standalone || installed ? "可以从主屏幕或桌面打开 Kotoba。" : "安装后可全屏启动，并继续使用已缓存页面。"}</p>
        </div>
        <button type="button" className="primary-button" onClick={installApp} disabled={standalone || installed}>
          {standalone || installed ? <CheckCircle2 size={16} /> : <Smartphone size={16} />}
          {standalone || installed ? "已安装" : "安装应用"}
        </button>
      </div>
      <ol>
        {steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      {message ? <p className="install-message">{message}</p> : null}
      <style jsx>{`
        .install-panel { border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:16px; }
        .install-head { display:flex; gap:16px; align-items:center; justify-content:space-between; }
        strong { display:block; font-size:16px; }
        p { margin:6px 0 0; color:var(--muted); font-size:12px; line-height:1.6; }
        ol { margin:16px 0 0; padding-left:22px; color:var(--muted); font-size:13px; line-height:1.9; }
        .install-message { margin-top:12px; color:var(--red); font-weight:700; }
        button:disabled { cursor:not-allowed; opacity:.55; }
        @media(max-width:620px) {
          .install-head { align-items:stretch; flex-direction:column; }
          .install-head button { width:100%; }
        }
      `}</style>
    </div>
  );
}

function subscribeInstallPlatform() {
  return () => undefined;
}

function getBrowserInstallPlatform() {
  return getInstallPlatform(navigator.userAgent);
}

function getServerInstallPlatform(): InstallPlatform {
  return "desktop";
}

function subscribeStandaloneDisplay(callback: () => void) {
  const standaloneQuery = window.matchMedia("(display-mode: standalone)");
  standaloneQuery.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    standaloneQuery.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function getBrowserStandaloneDisplay() {
  return isStandaloneDisplay(
    window.matchMedia("(display-mode: standalone)").matches,
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  );
}

function getServerStandaloneDisplay() {
  return false;
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="settings-section">
      <div className="section-copy"><h2>{title}</h2><p>{description}</p></div>
      <form className="section-fields" onSubmit={(event) => event.preventDefault()}>{children}</form>
      <style jsx>{`
        .settings-section { display:grid; grid-template-columns:220px 1fr; gap:40px; border-top:1px solid var(--ink); padding:28px 0; margin-top:36px; }
        h2 { margin:0; font-size:18px; }
        p { margin:7px 0 0; color:var(--muted); font-size:12px; line-height:1.6; }
        .section-fields { display:grid; gap:0; }
        @media(max-width:680px) { .settings-section { grid-template-columns:1fr; gap:20px; } }
      `}</style>
    </section>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="setting-row">
      <span>{label}</span>
      {children}
      <style jsx>{`
        .setting-row { display:grid; grid-template-columns:150px 1fr; gap:18px; align-items:center; min-height:66px; border-bottom:1px solid var(--rule); }
        span { font-size:13px; font-weight:700; }
        @media(max-width:620px) { .setting-row { grid-template-columns:1fr; gap:8px; padding:14px 0; } }
      `}</style>
    </label>
  );
}

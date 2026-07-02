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
    setMessage("????????API Key ????????");
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
    setMessage("??????API Key ???????");
  };

  const confirmClear = () => {
    if (window.confirm("????????????????????????")) {
      clearProgress();
      setMessage("????????");
    }
  };

  return (
    <AppShell>
      <div className="page-wrap settings-page">
        <header>
          <p className="eyebrow">Preferences</p>
          <h1 className="page-title">??</h1>
        </header>

        <SettingsSection title="????" description="?????????????">
          <SettingRow label="??????">
            <select value={settings.level} onChange={(event) => updateSettings({ level: event.target.value as StudyLevel })}>
              {studyLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
          </SettingRow>
          <SettingRow label="??????">
            <input type="number" min={1} max={100} value={settings.dailyGoal} onChange={(event) => updateSettings({ dailyGoal: Number(event.target.value) })} />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="AI ???" description="????????????????????????">
          <SettingRow label="?? AI ??">
            <input type="checkbox" checked={settings.aiEnabled} onChange={(event) => updateSettings({ aiEnabled: event.target.checked })} />
          </SettingRow>
          <SettingRow label="AI ???">
            <select value={selectedProvider} onChange={(event) => updateAiProvider(event.target.value as AiProvider)}>
              {aiProviderPresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
            </select>
          </SettingRow>
          <input type="text" autoComplete="username" value={`kotoba-${selectedProvider}`} readOnly hidden aria-hidden="true" />
          <SettingRow label="API Key">
            <div className="inline-control">
              <input type="password" autoComplete="new-password" value={settings.apiKey} onChange={(event) => updateSettings({ apiKey: event.target.value })} placeholder={providerPreset.keyPlaceholder} />
              <button type="button" className="secondary-button" onClick={() => updateSettings({ apiKey: "", aiEnabled: false })}><KeyRound size={15} /> ??</button>
            </div>
          </SettingRow>
          <SettingRow label="??">
            <input value={settings.model} onChange={(event) => updateSettings({ model: event.target.value })} />
          </SettingRow>
          <SettingRow label="API Endpoint">
            <input value={settings.endpoint} onChange={(event) => updateSettings({ endpoint: event.target.value })} />
          </SettingRow>
          <p className="security-note">API Key ??????????????????????? Endpoint ??????? OpenAI-compatible ???</p>
        </SettingsSection>

        <SettingsSection title="????" description="???????????????????????????? API Key?">
          <div className="action-row">
            <button type="button" className="secondary-button" onClick={exportBackup}><Download size={16} /> ?? JSON</button>
            <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> ?? JSON</button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={(event) => void importBackup(event.target.files?.[0])} />
          </div>
          <p className="security-note">????????????? JSON ????? API Key???????????????</p>
        </SettingsSection>

        <SettingsSection title="????" description="? Kotoba ???????????????????????????">
          <PwaInstallPanel />
        </SettingsSection>

        <SettingsSection title="????" description="???????????">
          <div className="source-note">
            <p>CET ???? ECDICT ????????? MIT ?????????</p>
            <p>JLPT ??????????? JMdict ?????? CC BY-SA 4.0 ?????????JLPT ??????????? JLPT ??????? gloss?</p>
          </div>
        </SettingsSection>

        <SettingsSection title="????" description="???????????????">
          <button type="button" className="danger-button" onClick={confirmClear}><Trash2 size={16} /> ??????</button>
        </SettingsSection>

        {message ? <p className="settings-message">{message}</p> : null}
      </div>

      <style jsx>{`
        .settings-page { max-width:900px; }
        .inline-control,.action-row { display:flex; gap:8px; }
        input:not([type="checkbox"]),select { width:min(440px,100%); min-height:42px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:0 12px; color:var(--ink); }
        input[type="checkbox"] { width:20px; height:20px; accent-color:var(--green); }
        .security-note { margin:12px 0 0; color:var(--muted); font-size:12px; line-height:1.7; }
        .source-note { display:grid; gap:8px; color:var(--muted); font-size:13px; line-height:1.75; }
        .source-note p { margin:0; }
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
      setMessage("?????????????????");
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
      setMessage(platform === "ios" ? "iPhone ??????????????" : "????????????????????????");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setMessage(choice.outcome === "accepted" ? "??????" : "?????????????");
  };

  const steps = getInstallSteps(platform);

  return (
    <div className="install-panel">
      <div className="install-head">
        <div>
          <strong>{standalone || installed ? "????????" : "?? Kotoba"}</strong>
          <p>{standalone || installed ? "??????????? Kotoba?" : "????????????????????"}</p>
        </div>
        <button type="button" className="primary-button" onClick={installApp} disabled={standalone || installed}>
          {standalone || installed ? <CheckCircle2 size={16} /> : <Smartphone size={16} />}
          {standalone || installed ? "???" : "????"}
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

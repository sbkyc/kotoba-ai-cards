"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { requestAiJson, type AiPayload } from "@/lib/ai/client";
import { buildDifferencePrompt, buildExamplePrompt, buildQuizPrompt } from "@/lib/ai/prompts";
import { getDefaultExamSection } from "@/lib/practice/examSections";
import { buildOfflineExamQuizPayload } from "@/lib/practice/offlinePaper";
import { previewReview, type ReviewRating } from "@/lib/scheduler/scheduler";
import { mapStudyKey } from "@/lib/study/keyboard";
import { buildStudyQueue, type StudyMode } from "@/lib/study/queue";
import { getNextQueueIndexAfterRating, recordSessionRating, type SessionStats } from "@/lib/study/session";
import { getCoreVocabularyByLevel, getExamFocusVocabularyByLevel, getVocabularyByLevel } from "@/lib/vocabulary/data";
import { buildVocabularyEvidence } from "@/lib/vocabulary/trust";
import { AiPanel } from "@/components/AiPanel";
import { AppShell } from "@/components/AppShell";
import { StudyModeTabs } from "@/components/StudyModeTabs";
import { VocabularyCardView } from "@/components/VocabularyCard";
import { useStudyStore } from "@/store/useStudyStore";

const emptySession: SessionStats = { completed: 0, known: 0, fuzzy: 0, unknown: 0 };

export function StudyClient() {
  const settings = useStudyStore((state) => state.settings);
  const progress = useStudyStore((state) => state.progress);
  const favorites = useStudyStore((state) => state.favorites);
  const rateCard = useStudyStore((state) => state.rateCard);
  const toggleFavorite = useStudyStore((state) => state.toggleFavorite);
  const [mode, setMode] = useState<StudyMode>("daily");

  const cards = useMemo(
    () => {
      if (mode === "core") return getCoreVocabularyByLevel(settings.level);
      if (mode === "exam") return getExamFocusVocabularyByLevel(settings.level);
      return getVocabularyByLevel(settings.level);
    },
    [mode, settings.level],
  );
  const queue = useMemo(
    () => buildStudyQueue(cards, progress, { dailyGoal: settings.dailyGoal, favoriteIds: favorites, mode }),
    [cards, favorites, mode, progress, settings.dailyGoal],
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>(emptySession);
  const [aiPayload, setAiPayload] = useState<AiPayload | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const card = queue[index % Math.max(queue.length, 1)];
  const evidence = useMemo(() => (card ? buildVocabularyEvidence(card) : undefined), [card]);

  const resetCardView = useCallback(() => {
    setIndex(0);
    setRevealed(false);
    setAiPayload(null);
    setAiError("");
  }, []);

  const handleModeChange = useCallback((nextMode: StudyMode) => {
    setMode(nextMode);
    resetCardView();
  }, [resetCardView]);

  const handleRate = useCallback((rating: ReviewRating) => {
    if (!card) return;
    rateCard(card.id, rating);
    setSessionStats((stats) => recordSessionRating(stats, rating));
    setRevealed(false);
    setAiPayload(null);
    setAiError("");
    setIndex((value) => getNextQueueIndexAfterRating({ previousIndex: value, nextQueueLength: queue.length - 1 }));
  }, [card, queue.length, rateCard]);

  const handleQuizRate = useCallback((rating: "known" | "unknown") => {
    if (!card) return;
    rateCard(card.id, rating);
    setSessionStats((stats) => recordSessionRating(stats, rating));
    setRevealed(false);
    setAiPayload(null);
    setAiError("");
    setIndex((value) => getNextQueueIndexAfterRating({ previousIndex: value, nextQueueLength: queue.length - 1 }));
  }, [card, queue.length, rateCard]);

  const handleFavorite = useCallback(() => {
    if (card) toggleFavorite(card.id);
  }, [card, toggleFavorite]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) return;
      const command = mapStudyKey(event.key, revealed);
      if (!command) return;
      event.preventDefault();
      if (command === "reveal") setRevealed(true);
      else if (command === "favorite") handleFavorite();
      else handleRate(command);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleFavorite, handleRate, revealed]);

  const handleAiAction = async (action: "example" | "difference" | "quiz") => {
    if (!card) return;
    if (!settings.aiEnabled || !settings.apiKey) {
      if (action === "quiz") {
        setAiError("");
        setAiPayload(buildOfflineExamQuizPayload(card, cards, getDefaultExamSection(settings.level)));
        return;
      }

      setAiError("?????????????? AI ??? API Key?");
      return;
    }

    const prompt =
      action === "example"
        ? buildExamplePrompt(card)
        : action === "difference"
          ? buildDifferencePrompt(card)
          : buildQuizPrompt(card);

    setAiLoading(true);
    setAiError("");
    setAiPayload(null);
    try {
      setAiPayload(await requestAiJson(prompt, settings));
    } catch (error) {
      if (action === "quiz") {
        setAiPayload(buildOfflineExamQuizPayload(card, cards, getDefaultExamSection(settings.level)));
        setAiError("AI ??????????????");
      } else {
        setAiError(error instanceof Error ? error.message : "AI ?????");
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (!card) {
    return (
      <AppShell>
        <div className="page-wrap session-complete">
          <StudyModeTabs value={mode} onChange={handleModeChange} />
          <p className="eyebrow">Session Complete</p>
          <h1>{emptyTitle(mode)}</h1>
          <p className="muted">???? {sessionStats.completed} ????{emptyHint(mode)}</p>
          <div className="complete-stats">
            <SessionStat label="??" value={sessionStats.known} />
            <SessionStat label="??" value={sessionStats.fuzzy} />
            <SessionStat label="???" value={sessionStats.unknown} />
          </div>
          <div className="complete-actions">
            <Link href="/" className="primary-button">???? <ArrowRight size={16} /></Link>
            <Link href="/library" className="secondary-button">?????</Link>
            <Link href="/settings" className="secondary-button">??????</Link>
          </div>
        </div>
        <style jsx>{`
          .session-complete { max-width:720px; padding-top:10vh; }
          h1 { margin:10px 0; font-family:Georgia,serif; font-size:clamp(42px,7vw,76px); font-weight:500; line-height:1.05; }
          .complete-stats { display:grid; grid-template-columns:repeat(3,1fr); margin-top:40px; border-block:1px solid var(--ink); }
          .complete-actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:32px; }
        `}</style>
      </AppShell>
    );
  }

  const previews = {
    unknown: previewReview(progress[card.id], "unknown"),
    fuzzy: previewReview(progress[card.id], "fuzzy"),
    known: previewReview(progress[card.id], "known"),
  };
  const progressPercent = Math.round((sessionStats.completed / Math.max(sessionStats.completed + queue.length, 1)) * 100);

  return (
    <AppShell>
      <div className="page-wrap study-page">
        <header className="session-header">
          <Link href="/" className="text-button"><ArrowLeft size={17} /> ????</Link>
          <div className="session-progress">
            <span>{sessionStats.completed} ???</span>
            <div><i style={{ width: `${progressPercent}%` }} /></div>
            <strong>{queue.length} {queueLabel(mode)}</strong>
          </div>
          <button type="button" className="text-button" onClick={() => setSessionStats(emptySession)}>
            <RotateCcw size={16} /> ????
          </button>
          <StudyModeTabs value={mode} onChange={handleModeChange} />
        </header>

        <VocabularyCardView
          card={card}
          onRate={handleRate}
          isFavorite={favorites.includes(card.id)}
          onToggleFavorite={handleFavorite}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          previews={previews}
          evidence={mode === "core" || mode === "exam" || evidence?.recommendationBadges.length ? evidence : undefined}
        >
          <AiPanel
            loading={aiLoading}
            error={aiError}
            payload={aiPayload}
            aiEnabled={settings.aiEnabled && Boolean(settings.apiKey)}
            revealed={revealed}
            onAction={handleAiAction}
            onQuizRate={handleQuizRate}
          />
        </VocabularyCardView>
      </div>

      <style jsx>{`
        .study-page { max-width:900px; }
        .session-header { display:grid; grid-template-columns:auto 1fr auto; gap:24px; align-items:center; border-bottom:1px solid var(--rule); padding-bottom:16px; }
        .session-header :global(.mode-tabs) { grid-column:1 / -1; }
        .session-progress { display:grid; grid-template-columns:auto minmax(80px,320px) auto; gap:12px; align-items:center; justify-content:center; color:var(--muted); font-size:11px; }
        .session-progress div { height:4px; background:var(--rule); overflow:hidden; }
        .session-progress i { display:block; height:100%; background:var(--red); transition:width .25s ease; }
        .session-progress strong { color:var(--ink); }
        @media(max-width:620px) {
          .session-header { grid-template-columns:auto 1fr; }
          .session-header > button { display:none; }
          .session-progress { grid-template-columns:auto 1fr; }
          .session-progress strong { display:none; }
        }
      `}</style>
    </AppShell>
  );
}

function queueLabel(mode: StudyMode) {
  if (mode === "difficult") return "???";
  if (mode === "core") return "???";
  if (mode === "exam") return "???";
  if (mode === "favorites") return "???";
  return "???";
}

function emptyTitle(mode: StudyMode) {
  if (mode === "difficult") return "??????????";
  if (mode === "core") return "???????????";
  if (mode === "exam") return "???????????";
  if (mode === "favorites") return "?????????";
  return "?????????";
}

function emptyHint(mode: StudyMode) {
  if (mode === "difficult") return "????????????????????";
  if (mode === "core") return "????????????????????????????";
  if (mode === "exam") return "?????????????????????????";
  if (mode === "favorites") return "?????????????????????";
  return "?????????????????????";
}

function SessionStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: "20px", borderRight: "1px solid var(--rule)" }}>
      <span className="muted" style={{ fontSize: 12 }}>{label}</span>
      <strong style={{ display: "block", marginTop: 6, fontFamily: "Georgia, serif", fontSize: 32 }}>{value}</strong>
    </div>
  );
}

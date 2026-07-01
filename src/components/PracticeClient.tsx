"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { requestAiJson } from "@/lib/ai/client";
import { buildPracticePaperPrompt } from "@/lib/ai/prompts";
import {
  buildPracticeSourceCards,
  buildPracticeSessionRecord,
  gradePracticeSession,
  buildWeakCardSummaries,
  isCorrectAnswer,
  normalizePracticePaper,
  type PracticePaper,
  type PracticeMode,
  type PracticeReport,
} from "@/lib/practice/practice";
import { getStudyLevelMeta, getVocabularyByLevel } from "@/lib/vocabulary/data";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/store/useStudyStore";

const questionCount = 10;
const retakeStorageKey = "kotoba-retake-paper";

const practiceModes: Array<{
  value: PracticeMode;
  title: string;
  description: string;
}> = [
  { value: "weak", title: "错题专项", description: "优先抽取错题、模糊词和学习中词条" },
  { value: "new", title: "新词检测", description: "只检测还没学过的新词" },
  { value: "favorites", title: "收藏词训练", description: "围绕手动收藏的重点词出题" },
  { value: "mock", title: "随机模拟卷", description: "从当前词库稳定覆盖抽样" },
];

export function PracticeClient() {
  const settings = useStudyStore((state) => state.settings);
  const progress = useStudyStore((state) => state.progress);
  const favorites = useStudyStore((state) => state.favorites);
  const rateCard = useStudyStore((state) => state.rateCard);
  const recordPracticeSession = useStudyStore((state) => state.recordPracticeSession);
  const practiceSessions = useStudyStore((state) => state.practiceSessions ?? []);
  const initialRetake = useMemo(() => readRetakePaper(), []);
  const [mode, setMode] = useState<PracticeMode>(initialRetake?.mode ?? "weak");
  const cards = useMemo(() => getVocabularyByLevel(settings.level), [settings.level]);
  const sourceCards = useMemo(
    () => buildPracticeSourceCards(cards, progress, { size: questionCount, mode, favoriteIds: favorites }),
    [cards, favorites, mode, progress],
  );
  const levelMeta = getStudyLevelMeta(settings.level);
  const selectedMode = practiceModes.find((item) => item.value === mode) ?? practiceModes[0];
  const weakCount = sourceCards.filter((card) => progress[card.id]).length;
  const [paper, setPaper] = useState<PracticePaper | null>(initialRetake?.paper ?? null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [report, setReport] = useState<PracticeReport | null>(null);
  const weakCards = report ? buildWeakCardSummaries(report.weakQuestions, cards) : [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedCount = paper?.questions.filter((question) => answers[question.id]).length ?? 0;
  const canGenerate = settings.aiEnabled && Boolean(settings.apiKey) && sourceCards.length > 0;

  const generatePaper = async () => {
    if (!canGenerate) {
      setError(sourceCards.length === 0 ? getEmptyModeMessage(mode) : "请先在设置页启用 AI 并填写 API Key。");
      return;
    }

    setLoading(true);
    setError("");
    setPaper(null);
    setReport(null);
    setAnswers({});

    try {
      const payload = await requestAiJson(
        buildPracticePaperPrompt(sourceCards, { questionCount: Math.min(questionCount, sourceCards.length) }),
        settings,
      );
      const nextPaper = normalizePracticePaper(payload, sourceCards);
      if (!nextPaper.questions.length) throw new Error("AI 返回的题目无法匹配当前词条，请重新生成。");
      setPaper(nextPaper);
    } catch (error) {
      setError(error instanceof Error ? error.message : "AI 组卷失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const submitPaper = () => {
    if (!paper) return;
    const nextReport = gradePracticeSession(paper.questions, answers);
    for (const [cardId, rating] of Object.entries(nextReport.ratingsByCardId)) {
      rateCard(cardId, rating);
    }
    recordPracticeSession(buildPracticeSessionRecord({
      id: `practice-${Date.now()}`,
      level: settings.level,
      mode,
      paper,
      report: nextReport,
      answersByQuestionId: answers,
    }));
    setReport(nextReport);
  };

  const reset = () => {
    setPaper(null);
    setReport(null);
    setAnswers({});
    setError("");
  };

  return (
    <AppShell>
      <div className="page-wrap practice-page">
        <header className="practice-hero">
          <div>
            <p className="eyebrow">AI Practice · {levelMeta.label}</p>
            <h1 className="page-title">专项刷题，检查是不是真记住了。</h1>
            <p className="hero-copy">
              {selectedMode.description}，生成接近 {levelMeta.language === "ja" ? "JLPT" : "CET"} 的原创四选一小测。
            </p>
          </div>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={generatePaper} disabled={loading || !canGenerate}>
              {loading ? <Loader2 size={17} className="spin" /> : <BrainCircuit size={17} />}
              生成专项小测
            </button>
            <button type="button" className="secondary-button" onClick={reset}>
              <RotateCcw size={16} />
              重置
            </button>
            <Link href="/practice/mistakes" className="secondary-button">错题本</Link>
          </div>
        </header>

        <section className="practice-mode-grid" aria-label="刷题模式">
          {practiceModes.map((item) => (
            <button
              key={item.value}
              type="button"
              className={mode === item.value ? "active" : ""}
              onClick={() => {
                setMode(item.value);
                reset();
              }}
            >
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </section>

        <section className="practice-stats" aria-label="专项刷题概览">
          <PracticeStat label="本次题量" value={Math.min(questionCount, sourceCards.length)} suffix="题" />
          <PracticeStat label={mode === "favorites" ? "收藏词" : mode === "new" ? "新词" : "重点词"} value={mode === "favorites" ? sourceCards.length : weakCount} suffix="词" />
          <PracticeStat label="已选择" value={selectedCount} suffix={paper ? `/${paper.questions.length}` : "/0"} />
        </section>

        {sourceCards.length === 0 ? (
          <p className="mode-empty">{getEmptyModeMessage(mode)}</p>
        ) : null}

        {!settings.aiEnabled || !settings.apiKey ? (
          <div className="setup-panel">
            <strong>AI 刷题还没启用</strong>
            <p>去设置页选择 OpenAI、DeepSeek、通义千问、Gemini、Anthropic、OpenRouter 或兼容接口，并填入自己的密钥。</p>
            <Link href="/settings" className="secondary-button">去设置</Link>
          </div>
        ) : null}

        {error ? <p className="practice-error">{error}</p> : null}

        {!paper && practiceSessions.length ? (
          <section className="history-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">History</p>
                <h2>最近刷题记录</h2>
              </div>
            </div>
            <div className="history-list">
              {practiceSessions.slice(-5).reverse().map((session) => (
                <Link key={session.id} href={`/practice/history?session=${encodeURIComponent(session.id)}`} className="history-row">
                  <div>
                    <strong>{session.title}</strong>
                    <span>{new Date(session.takenAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <b>{session.accuracy}%</b>
                  <small>{session.correct}/{session.total} · {session.weakCardIds.length} 个薄弱词</small>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {paper && !report ? (
          <section className="paper-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Paper</p>
                <h2>{paper.title}</h2>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={submitPaper}
                disabled={selectedCount < paper.questions.length}
              >
                交卷 <ArrowRight size={16} />
              </button>
            </div>
            <div className="question-list">
              {paper.questions.map((question, index) => (
                <article key={question.id} className="question-card">
                  <div className="question-head">
                    <span>第 {index + 1} 题</span>
                    <strong>{question.skill}</strong>
                  </div>
                  <p>{question.stem}</p>
                  <div className="option-grid">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={answers[question.id] === option ? "selected" : ""}
                        onClick={() => setAnswers((value) => ({ ...value, [question.id]: option }))}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {paper && report ? (
          <section className="report-panel">
            <div className="report-score">
              <span>掌握度</span>
              <strong>{report.accuracy}%</strong>
              <p>{report.summary}</p>
            </div>
            <div className="report-breakdown">
              <PracticeStat label="答对" value={report.correct} suffix={`/${report.total}`} />
              <PracticeStat label="需要复盘" value={report.weakQuestions.length} suffix="题" />
            </div>
            {weakCards.length ? (
              <div className="weak-card-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Mistakes</p>
                    <h2>本轮错题本</h2>
                  </div>
                  <Link href="/study" className="secondary-button">去复习</Link>
                </div>
                <div className="weak-card-list">
                  {weakCards.map((card) => (
                    <Link key={card.id} href={`/library?query=${encodeURIComponent(card.word)}`} className="weak-card">
                      <strong>{card.word}</strong>
                      {card.kana ? <span>{card.kana}</span> : null}
                      <small>{card.meaningZh}</small>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="review-list">
              {paper.questions.map((question, index) => {
                const selected = answers[question.id] ?? "未作答";
                const correct = isCorrectAnswer(selected, question);
                return (
                  <article key={question.id} className={correct ? "review-row correct" : "review-row wrong"}>
                    <div>
                      {correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      <strong>第 {index + 1} 题</strong>
                    </div>
                    <p>{question.stem}</p>
                    <small>你的答案：{selected} · 正确答案：{question.answer}</small>
                    <span>{question.explanation}</span>
                  </article>
                );
              })}
            </div>
            <div className="report-actions">
              <button type="button" className="primary-button" onClick={generatePaper}>再来一套</button>
              <Link href="/study" className="secondary-button">回到词卡复习</Link>
            </div>
          </section>
        ) : null}
      </div>

      <style jsx>{`
        .practice-page { max-width:980px; }
        .practice-hero { display:grid; grid-template-columns:1fr auto; gap:28px; align-items:end; border-bottom:1px solid var(--ink); padding-bottom:26px; }
        .hero-copy { max-width:680px; margin:16px 0 0; color:var(--muted); font-size:16px; line-height:1.8; }
        .hero-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:10px; }
        button:disabled { cursor:not-allowed; opacity:.5; }
        .practice-mode-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin-top:18px; }
        .practice-mode-grid button { min-height:86px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:12px; color:var(--ink); text-align:left; }
        .practice-mode-grid button.active { border-color:var(--ink); background:var(--ink); color:white; }
        .practice-mode-grid strong,.practice-mode-grid span { display:block; }
        .practice-mode-grid span { margin-top:6px; color:var(--muted); font-size:12px; line-height:1.45; }
        .practice-mode-grid button.active span { color:rgba(255,255,255,.72); }
        .practice-stats { display:grid; grid-template-columns:repeat(3,1fr); border-bottom:1px solid var(--rule); }
        .mode-empty { margin:18px 0 0; color:var(--muted); line-height:1.7; }
        .setup-panel { display:grid; gap:10px; margin-top:24px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:18px; }
        .setup-panel p { margin:0; color:var(--muted); line-height:1.7; }
        .setup-panel .secondary-button { width:max-content; }
        .practice-error { margin:18px 0 0; color:var(--red); font-weight:700; }
        .paper-panel,.report-panel,.history-panel { margin-top:34px; }
        .section-heading { display:flex; justify-content:space-between; align-items:end; gap:18px; margin-bottom:18px; }
        .section-heading h2 { margin:5px 0 0; font-size:24px; }
        .question-list { display:grid; gap:14px; }
        .history-list { display:grid; border-top:1px solid var(--ink); }
        .history-row { display:grid; grid-template-columns:1fr auto auto; gap:14px; align-items:center; border-bottom:1px solid var(--rule); padding:14px 0; color:var(--ink); text-decoration:none; }
        .history-row:hover { color:var(--red); }
        .history-row div { display:grid; gap:4px; }
        .history-row span,.history-row small { color:var(--muted); font-size:12px; }
        .history-row b { font-family:Georgia,serif; font-size:26px; }
        .question-card { border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:16px; }
        .question-head { display:flex; justify-content:space-between; gap:12px; color:var(--red); font-size:12px; font-weight:700; }
        .question-card p { margin:12px 0; line-height:1.75; }
        .option-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
        .option-grid button { min-height:44px; border:1px solid var(--rule); border-radius:6px; background:var(--paper); padding:9px 11px; color:var(--ink); text-align:left; line-height:1.45; }
        .option-grid button.selected { border-color:var(--green); background:var(--green-soft); color:var(--green); font-weight:700; }
        .report-panel { display:grid; gap:22px; }
        .report-score { display:grid; justify-items:center; border-block:1px solid var(--ink); padding:30px 0; text-align:center; }
        .report-score span { color:var(--muted); font-size:12px; font-weight:700; }
        .report-score strong { margin-top:5px; font-family:Georgia,serif; font-size:72px; line-height:1; }
        .report-score p { margin:10px 0 0; color:var(--muted); }
        .report-breakdown { display:grid; grid-template-columns:repeat(2,1fr); border-top:1px solid var(--rule); }
        .weak-card-panel { display:grid; gap:14px; }
        .weak-card-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .weak-card { display:grid; gap:5px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:13px; color:var(--ink); text-decoration:none; }
        .weak-card:hover { border-color:var(--red); color:var(--red); }
        .weak-card span,.weak-card small { color:var(--muted); font-size:12px; line-height:1.5; }
        .review-list { display:grid; gap:10px; }
        .review-row { display:grid; gap:8px; border:1px solid var(--rule); border-left-width:4px; border-radius:6px; background:var(--surface); padding:14px; }
        .review-row.correct { border-left-color:var(--green); }
        .review-row.wrong { border-left-color:var(--red); }
        .review-row div { display:flex; align-items:center; gap:8px; }
        .review-row p,.review-row small,.review-row span { margin:0; line-height:1.65; }
        .review-row small { color:var(--muted); }
        .report-actions { display:flex; flex-wrap:wrap; gap:10px; }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @media(max-width:720px) {
          .practice-hero { grid-template-columns:1fr; }
          .practice-mode-grid { grid-template-columns:1fr 1fr; }
          .hero-actions { justify-content:stretch; }
          .hero-actions button { width:100%; }
          .practice-stats,.report-breakdown { grid-template-columns:1fr; }
          .weak-card-list { grid-template-columns:1fr; }
          .history-row { grid-template-columns:1fr auto; }
          .history-row small { grid-column:1 / -1; }
          .option-grid { grid-template-columns:1fr; }
          .section-heading { align-items:stretch; flex-direction:column; }
        }
      `}</style>
    </AppShell>
  );
}

function getEmptyModeMessage(mode: PracticeMode) {
  if (mode === "favorites") return "收藏词训练需要先在词库或学习页收藏一些重点词。";
  if (mode === "new") return "当前词库的新词已经全部进入学习记录，可以切换到错题专项或随机模拟卷。";
  return "当前模式暂时没有可用词条。";
}

function readRetakePaper(): { paper: PracticePaper; mode: PracticeMode } | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(retakeStorageKey);
  if (!raw) return null;
  window.sessionStorage.removeItem(retakeStorageKey);

  try {
    const parsed = JSON.parse(raw) as { paper?: PracticePaper; mode?: PracticeMode };
    if (!parsed.paper?.questions?.length) return null;
    return { paper: parsed.paper, mode: parsed.mode ?? "weak" };
  } catch {
    return null;
  }
}

function PracticeStat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="practice-stat">
      <span>{label}</span>
      <strong>{value}<small>{suffix}</small></strong>
      <style jsx>{`
        .practice-stat { min-height:104px; border-right:1px solid var(--rule); padding:20px 18px; }
        span { display:block; color:var(--muted); font-size:12px; font-weight:700; }
        strong { display:block; margin-top:10px; font-family:Georgia,serif; font-size:34px; }
        small { margin-left:4px; font-family:Arial,sans-serif; color:var(--muted); font-size:12px; }
      `}</style>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, BrainCircuit, CircleAlert, Flame, Target } from "lucide-react";
import { aggregateRecentActivity, filterReviewEventsByCardIds, rankDifficultCards } from "@/lib/activity/activity";
import { buildLearningLoopInsight } from "@/lib/progress/insights";
import { getStudyStats } from "@/lib/progress/progress";
import { getStudyLevelMeta, getVocabularyByLevel, studyLevels } from "@/lib/vocabulary/data";
import { buildStudyQueue } from "@/lib/study/queue";
import { AppShell } from "@/components/AppShell";
import { ActivityChart } from "@/components/ActivityChart";
import { useStudyStore } from "@/store/useStudyStore";

export function HomeClient() {
  const settings = useStudyStore((state) => state.settings);
  const progress = useStudyStore((state) => state.progress);
  const favorites = useStudyStore((state) => state.favorites);
  const reviewEvents = useStudyStore((state) => state.reviewEvents);
  const practiceSessions = useStudyStore((state) => state.practiceSessions ?? []);
  const setLevel = useStudyStore((state) => state.setLevel);

  const cards = getVocabularyByLevel(settings.level);
  const cardIds = cards.map((card) => card.id);
  const queue = buildStudyQueue(cards, progress, { dailyGoal: settings.dailyGoal });
  const stats = getStudyStats(progress, new Date(), cardIds);
  const currentPracticeSessions = practiceSessions.filter((session) => session.level === settings.level);
  const loopInsight = buildLearningLoopInsight({
    cards,
    progress,
    favoriteIds: favorites,
    practiceSessions: currentPracticeSessions,
    dailyGoal: settings.dailyGoal,
  });
  const dueCount = loopInsight.dueCount;
  const newCount = loopInsight.newCount;
  const favoriteCount = favorites.filter((id) => cards.some((card) => card.id === id)).length;
  const masteredCount = cards.filter((card) => progress[card.id]?.status === "known").length;
  const currentReviewEvents = filterReviewEventsByCardIds(reviewEvents, cardIds);
  const activity = aggregateRecentActivity(currentReviewEvents);
  const difficult = rankDifficultCards(cards, progress, favorites, 4).filter((card) => progress[card.id]);
  const practiceInsight = buildPracticeInsight(currentPracticeSessions, cards);
  const progressPercent = Math.min(Math.round((stats.learnedToday / Math.max(settings.dailyGoal, 1)) * 100), 100);
  const levelMeta = getStudyLevelMeta(settings.level);

  return (
    <AppShell>
      <div className="page-wrap today-page">
        <section className="today-hero">
          <div>
            <p className="eyebrow">{formatDate(new Date())} · {levelMeta.family}</p>
            <h1 className="page-title">今天，继续向前。</h1>
            <p className="today-lead">
              {queue.length > 0 ? `还有 ${queue.length} 个词汇任务等待完成。` : "今天的计划已经完成，可以强化重点词。"}
            </p>
          </div>
          <div className="level-switch" aria-label="考试词库">
            {studyLevels.map((level) => (
              <button key={level.value} type="button" className={settings.level === level.value ? "active" : ""} onClick={() => setLevel(level.value)}>
                {level.shortLabel}
              </button>
            ))}
          </div>
        </section>

        <section className="start-panel">
          <div className="start-count">
            <span>到期复习</span>
            <strong>{dueCount}</strong>
            <small>{loopInsight.reviewReminderLabel}</small>
          </div>
          <div className="start-main">
            <div className="progress-heading">
              <span>今日进度</span>
              <strong>{stats.learnedToday} / {settings.dailyGoal}</strong>
            </div>
            <div className="progress-track" aria-label={`今日进度 ${progressPercent}%`}>
              <div style={{ width: `${progressPercent}%` }} />
            </div>
            <Link href="/study" className="primary-button">
              开始今日学习 <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        <section className="loop-panel" aria-label="学习闭环">
          <LoopItem
            step="学"
            title={`${newCount} 个新词`}
            description={`每日目标 ${settings.dailyGoal}，核心词优先进入计划`}
          />
          <LoopItem
            step="复"
            title={loopInsight.reviewReminderLabel}
            description={`${dueCount} 个到期词，按错误和模糊优先`}
          />
          <LoopItem
            step="测"
            title={`${practiceInsight.last7Count} 套小测`}
            description={`平均正确率 ${practiceInsight.averageAccuracy}%`}
          />
          <LoopItem
            step="改"
            title={loopInsight.weakSummary}
            description={loopInsight.weakAreas.map((area) => `${area.label} ${area.count}`).join(" · ") || "继续保持"}
          />
        </section>

        <section className="practice-dashboard">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI Practice</p>
              <h2>刷题看板</h2>
            </div>
            <Link href="/practice/mistakes" className="text-button">查看错题本</Link>
          </div>
          <div className="practice-metrics">
            <Metric label="近 7 天小测" value={practiceInsight.last7Count} suffix="套" />
            <Metric label="近 30 天小测" value={practiceInsight.last30Count} suffix="套" />
            <Metric label="平均正确率" value={practiceInsight.averageAccuracy} suffix="%" />
            <Metric label="薄弱词" value={practiceInsight.weakCount} suffix="词" />
          </div>
          {practiceInsight.topWeak.length ? (
            <div className="weak-strip">
              {practiceInsight.topWeak.map((item) => (
                <Link key={item.card.id} href={`/library?query=${encodeURIComponent(item.card.word)}`}>
                  <strong>{item.card.word}</strong>
                  <span>{item.count} 次</span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <div className="today-grid">
          <section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Plan</p>
                <h2>今日任务</h2>
              </div>
            </div>
            <div className="task-list">
              <TaskRow icon={CircleAlert} title="复习到期词汇" description="优先处理模糊与错误词" count={dueCount} href="/study" />
              <TaskRow icon={Target} title="学习新词" description={`每日目标 ${settings.dailyGoal} 词`} count={newCount} href="/study" />
              <TaskRow icon={BrainCircuit} title="AI专项刷题" description="按错题与模糊词组卷检测" count={difficult.length} href="/practice" />
              <TaskRow icon={Bookmark} title="重点词强化" description="回顾手动收藏的难词" count={favoriteCount} href="/library" />
            </div>
          </section>

          <section className="summary-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Progress</p>
                <h2>学习概览</h2>
              </div>
            </div>
            <div className="metric-grid">
              <Metric icon={Flame} label="连续学习" value={calculateStreak(activity)} suffix="天" />
              <Metric label="已掌握" value={masteredCount} suffix="词" />
              <Metric label="今日已学" value={stats.learnedToday} suffix="词" />
              <Metric label="已学掌握率" value={loopInsight.reviewedMasteryRate} suffix="%" />
            </div>
          </section>
        </div>

        <hr className="section-rule" />

        <div className="insight-grid">
          <section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">7 Days</p>
                <h2>学习节奏</h2>
              </div>
              <span className="muted">{currentReviewEvents.length ? "最近复习记录" : "还没有学习记录"}</span>
            </div>
            <ActivityChart data={activity} />
          </section>

          <section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Focus</p>
                <h2>最近难词</h2>
              </div>
              <Link href="/library" className="text-button">查看词库</Link>
            </div>
            <div className="difficult-list">
              {difficult.length ? difficult.map((card) => (
                <div key={card.id} className="difficult-row">
                  <div>
                    <strong>{card.word}</strong>
                    <span>{card.kana}</span>
                  </div>
                  <p>{card.meaningZh}</p>
                  <small>{progress[card.id]?.unknownCount ?? 0} 次错误</small>
                </div>
              )) : <p className="empty-copy">完成几次学习后，这里会列出最需要强化的词。</p>}
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .today-hero { display:flex; justify-content:space-between; gap:24px; align-items:flex-end; }
        .today-lead { margin:16px 0 0; color:var(--muted); font-size:16px; }
        .level-switch { display:flex; border:1px solid var(--rule); border-radius:999px; padding:3px; background:var(--surface); }
        .level-switch button { min-width:54px; height:34px; border:0; border-radius:999px; background:transparent; color:var(--muted); padding:0 10px; font-weight:700; }
        .level-switch button.active { background:var(--ink); color:white; }
        .start-panel { display:grid; grid-template-columns:170px 1fr; margin-top:36px; border-block:1px solid var(--ink); }
        .start-count { padding:24px 24px 24px 0; border-right:1px solid var(--rule); }
        .start-count span,.start-count small { display:block; color:var(--muted); }
        .start-count strong { display:block; margin:4px 0; font-family:Georgia,serif; font-size:54px; line-height:1; }
        .start-main { display:grid; grid-template-columns:1fr auto; gap:18px 28px; align-items:center; padding:24px 0 24px 28px; }
        .progress-heading { display:flex; justify-content:space-between; font-size:13px; }
        .progress-track { height:7px; grid-column:1; background:var(--rule); overflow:hidden; }
        .progress-track div { height:100%; background:var(--green); transition:width .3s ease; }
        .start-main .primary-button { grid-column:2; grid-row:1 / span 2; }
        .loop-panel { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1px; margin-top:24px; border:1px solid var(--rule); background:var(--rule); }
        .today-grid,.insight-grid { display:grid; grid-template-columns:1.1fr .9fr; gap:56px; margin-top:44px; }
        .practice-dashboard { margin-top:36px; border-top:1px solid var(--ink); padding-top:24px; }
        .practice-metrics { display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid var(--rule); border-left:1px solid var(--rule); }
        .weak-strip { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
        .weak-strip a { display:inline-flex; gap:8px; align-items:center; min-height:34px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:0 10px; color:var(--ink); text-decoration:none; }
        .weak-strip a:hover { border-color:var(--red); color:var(--red); }
        .weak-strip span { color:var(--muted); font-size:12px; }
        .section-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:18px; }
        .section-heading h2 { margin:5px 0 0; font-size:24px; }
        .task-list { border-top:1px solid var(--ink); }
        .metric-grid { display:grid; grid-template-columns:repeat(2,1fr); border-top:1px solid var(--ink); border-left:1px solid var(--rule); }
        .difficult-list { border-top:1px solid var(--ink); }
        .difficult-row { display:grid; grid-template-columns:1fr 1.5fr auto; gap:14px; align-items:center; padding:15px 0; border-bottom:1px solid var(--rule); }
        .difficult-row div { display:flex; gap:8px; align-items:baseline; }
        .difficult-row span,.difficult-row p,.difficult-row small { color:var(--muted); font-size:12px; margin:0; }
        .empty-copy { color:var(--muted); line-height:1.8; }
        @media (max-width:900px) { .today-grid,.insight-grid { grid-template-columns:1fr; gap:36px; } }
        @media (max-width:620px) {
          .today-hero { flex-direction:column; align-items:flex-start; }
          .level-switch { width:100%; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); border-radius:8px; }
          .level-switch button { min-width:0; width:100%; border-radius:6px; padding:0 4px; font-size:12px; }
          .start-panel { grid-template-columns:90px 1fr; }
          .start-count { padding:20px 14px 20px 0; }
          .start-count strong { font-size:42px; }
          .start-main { grid-template-columns:1fr; padding:20px 0 20px 18px; }
          .start-main .primary-button { grid-column:1; grid-row:auto; width:100%; }
          .progress-track { grid-column:1; }
          .practice-metrics { grid-template-columns:repeat(2,1fr); }
          .loop-panel { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .difficult-row { grid-template-columns:1fr auto; }
          .difficult-row p { grid-column:1; }
        }
      `}</style>
    </AppShell>
  );
}

function LoopItem({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="loop-item">
      <span>{step}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      <style jsx>{`
        .loop-item { min-height:116px; background:var(--surface); padding:16px; }
        span { display:grid; width:28px; height:28px; place-items:center; border-radius:999px; background:var(--blue-soft); color:var(--blue); font-weight:800; }
        strong { display:block; margin-top:12px; font-size:15px; line-height:1.35; }
        p { margin:6px 0 0; color:var(--muted); font-size:12px; line-height:1.55; }
      `}</style>
    </div>
  );
}

function TaskRow({ icon: Icon, title, description, count, href }: {
  icon: typeof Target;
  title: string;
  description: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-[72px] grid-cols-[22px_1fr_auto_18px] items-center gap-[13px] border-b border-[#d8d3c8] text-[#171714] no-underline transition-colors hover:text-[#c9472d]"
    >
      <Icon size={19} />
      <span>
        <strong className="block text-sm">{title}</strong>
        <small className="mt-1 block text-xs text-[#6d6a62]">{description}</small>
      </span>
      <b className="font-serif text-2xl">{count}</b>
      <ArrowRight size={16} />
    </Link>
  );
}

function Metric({ icon: Icon, label, value, suffix }: { icon?: typeof Flame; label: string; value: number; suffix: string }) {
  return (
    <div className="metric">
      <span>{Icon ? <Icon size={15} /> : null}{label}</span>
      <strong>{value}<small>{suffix}</small></strong>
      <style jsx>{`
        .metric { min-height:104px; border-right:1px solid var(--rule); border-bottom:1px solid var(--rule); padding:18px; }
        span { display:flex; gap:6px; color:var(--muted); font-size:12px; }
        strong { display:block; margin-top:12px; font-family:Georgia,serif; font-size:32px; }
        small { margin-left:4px; font-family:Arial,sans-serif; color:var(--muted); font-size:12px; }
      `}</style>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(date);
}

function calculateStreak(activity: { count: number }[]) {
  let streak = 0;
  for (let index = activity.length - 1; index >= 0; index -= 1) {
    if (activity[index].count === 0) break;
    streak += 1;
  }
  return streak;
}

function buildPracticeInsight(
  sessions: Array<{ takenAt: string; accuracy: number; weakCardIds: string[] }>,
  cards: ReturnType<typeof getVocabularyByLevel>,
) {
  const now = Date.now();
  const day = 86_400_000;
  const last7 = sessions.filter((session) => now - new Date(session.takenAt).getTime() <= 7 * day);
  const last30 = sessions.filter((session) => now - new Date(session.takenAt).getTime() <= 30 * day);
  const averageAccuracy = sessions.length
    ? Math.round(sessions.reduce((sum, session) => sum + session.accuracy, 0) / sessions.length)
    : 0;
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const counts = new Map<string, number>();

  for (const session of sessions) {
    for (const cardId of session.weakCardIds) {
      counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
    }
  }

  const topWeak = Array.from(counts.entries())
    .flatMap(([cardId, count]) => {
      const card = cardById.get(cardId);
      return card ? [{ card, count }] : [];
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    last7Count: last7.length,
    last30Count: last30.length,
    averageAccuracy,
    weakCount: counts.size,
    topWeak,
  };
}

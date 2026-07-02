"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Search, Star } from "lucide-react";
import { getPartsOfSpeech, getStudyLevelMeta, getVocabularyTags, studyLevels, vocabularyCards } from "@/lib/vocabulary/data";
import { getExampleDetail, getRelatedWordsDetail } from "@/lib/vocabulary/details";
import { getVisibleVocabulary } from "@/lib/vocabulary/pagination";
import { filterVocabulary } from "@/lib/vocabulary/search";
import { buildVocabularyEvidence } from "@/lib/vocabulary/trust";
import type { StudyLevel } from "@/lib/vocabulary/types";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/store/useStudyStore";

const PAGE_SIZE = 120;

export function LibraryClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("query") ?? "");
  const [level, setLevel] = useState<StudyLevel | "all">("all");
  const [tag, setTag] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [mastery, setMastery] = useState<"all" | "new" | "learning" | "known">("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleState, setVisibleState] = useState({ filterKey: "", limit: PAGE_SIZE });
  const progress = useStudyStore((state) => state.progress);
  const favorites = useStudyStore((state) => state.favorites);
  const toggleFavorite = useStudyStore((state) => state.toggleFavorite);

  const filtered = filterVocabulary(vocabularyCards, {
    query,
    level,
    tag: tag || undefined,
    partOfSpeech: partOfSpeech || undefined,
  })
    .filter((card) => mastery === "all" || (progress[card.id]?.status ?? "new") === mastery)
    .filter((card) => !favoriteOnly || favorites.includes(card.id));
  const filterKey = JSON.stringify([query, level, tag, partOfSpeech, mastery, favoriteOnly]);
  const visibleLimit = visibleState.filterKey === filterKey ? visibleState.limit : PAGE_SIZE;
  const visibleVocabulary = getVisibleVocabulary(filtered, visibleLimit);

  const resetFilters = () => {
    setQuery("");
    setLevel("all");
    setTag("");
    setPartOfSpeech("");
    setMastery("all");
    setFavoriteOnly(false);
  };

  return (
    <AppShell>
      <div className="page-wrap library-page">
        <header className="library-header">
          <div>
            <p className="eyebrow">Vocabulary</p>
            <h1 className="page-title">词汇库</h1>
          </div>
          <p>{filtered.length} / {vocabularyCards.length} 个词</p>
        </header>

        <div className="filter-bar">
          <label className="search-field">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索词汇" />
          </label>
          <select value={level} onChange={(event) => setLevel(event.target.value as StudyLevel | "all")}>
            <option value="all">全部词库</option>
            {studyLevels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select value={mastery} onChange={(event) => setMastery(event.target.value as typeof mastery)}>
            <option value="all">全部状态</option><option value="new">未学习</option><option value="learning">学习中</option><option value="known">已掌握</option>
          </select>
          <select value={partOfSpeech} onChange={(event) => setPartOfSpeech(event.target.value)}>
            <option value="">全部词性</option>
            {getPartsOfSpeech().map((part) => <option key={part} value={part}>{part}</option>)}
          </select>
          <select value={tag} onChange={(event) => setTag(event.target.value)}>
            <option value="">更多筛选</option>
            {getVocabularyTags().map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button type="button" className={favoriteOnly ? "favorite-filter active" : "favorite-filter"} onClick={() => setFavoriteOnly((value) => !value)} aria-label="只看重点词">
            <Star size={17} fill={favoriteOnly ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="vocab-table">
          <div className="table-head">
            <span />
            <span>词汇</span>
            <span>中文释义</span>
            <span>等级</span>
            <span>状态</span>
            <span>难度记录</span>
            <span>下次复习</span>
            <span />
          </div>
          {visibleVocabulary.visibleItems.map((card) => {
            const cardProgress = progress[card.id];
            const expanded = expandedId === card.id;
            const exampleDetail = getExampleDetail(card);
            const evidence = buildVocabularyEvidence(card);
            return (
              <article key={card.id} className={expanded ? "vocab-row expanded" : "vocab-row"}>
                <button type="button" className={favorites.includes(card.id) ? "row-star active" : "row-star"} onClick={() => toggleFavorite(card.id)} aria-label={favorites.includes(card.id) ? "取消重点词" : "加入重点词"}>
                  <Star size={16} fill={favorites.includes(card.id) ? "currentColor" : "none"} />
                </button>
                <div className="word-cell"><strong>{card.word}</strong><small>{card.kana}</small></div>
                <span className="meaning-cell">{card.meaningZh}</span>
                <span className="status-tag">{getStudyLevelMeta(card.level).shortLabel}</span>
                <span className={`mastery ${cardProgress?.status ?? "new"}`}>{statusLabel(cardProgress?.status)}</span>
                <span className="difficulty">{cardProgress ? `${cardProgress.unknownCount} 错 / ${cardProgress.fuzzyCount} 模糊` : "—"}</span>
                <span className="next-review">{formatDue(cardProgress?.dueAt)}</span>
                <button type="button" className="expand-button" onClick={() => setExpandedId(expanded ? null : card.id)} aria-label={expanded ? "收起详情" : "展开详情"}>
                  <ChevronDown size={17} className={expanded ? "rotate" : ""} />
                </button>
                {expanded ? (
                  <div className="row-details">
                    <div><span>{getStudyLevelMeta(card.level).exampleLabel}</span><p>{exampleDetail.primary}</p><small>{exampleDetail.secondary}</small></div>
                    <div><span>易混词</span><p>{getRelatedWordsDetail(card)}</p></div>
                    <div><span>标签</span><p>{card.tags.join(" / ")}</p></div>
                    <div><span>复习记录</span><p>{cardProgress ? `${cardProgress.reviewCount} 次复习，${cardProgress.knownCount} 次认识` : "还未开始学习"}</p></div>
                    <div className="evidence-detail">
                      <span>来源与推荐依据</span>
                      <div className="source-badges">
                        {evidence.recommendationBadges.map((badge) => <b key={badge}>{badge}</b>)}
                        {evidence.sourceBadges.map((badge) => <em key={badge.label}>{badge.label}</em>)}
                      </div>
                      <p>{evidence.reason}</p>
                      <small>{evidence.caution}</small>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {visibleVocabulary.hasMore ? (
          <div className="load-more-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setVisibleState({ filterKey, limit: visibleLimit + PAGE_SIZE })}
            >
              加载更多 {visibleVocabulary.visibleCount} / {visibleVocabulary.totalCount}
            </button>
          </div>
        ) : null}

        {!filtered.length ? (
          <div className="empty-list"><p>没有符合当前筛选条件的词汇。</p><button type="button" className="secondary-button" onClick={resetFilters}>重置筛选</button></div>
        ) : null}
      </div>

      <style jsx>{`
        .library-header { display:flex; justify-content:space-between; align-items:flex-end; }
        .library-header p:last-child { color:var(--muted); font-size:13px; }
        .filter-bar { display:grid; grid-template-columns:minmax(230px,1fr) repeat(4,140px) 42px; gap:8px; margin:30px 0 18px; }
        .filter-bar input,.filter-bar select,.favorite-filter { min-height:42px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); color:var(--ink); }
        .filter-bar select { padding:0 10px; }
        .search-field { display:flex; align-items:center; gap:8px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:0 12px; }
        .search-field input { width:100%; border:0; outline:0; }
        .favorite-filter { display:grid; place-items:center; }
        .favorite-filter.active { border-color:var(--red); background:var(--red-soft); color:var(--red); }
        .vocab-table { border-top:1px solid var(--ink); }
        .table-head,.vocab-row { display:grid; grid-template-columns:34px minmax(130px,1.1fr) minmax(150px,1.4fr) 60px 78px 100px 94px 32px; gap:14px; align-items:center; }
        .table-head { min-height:42px; border-bottom:1px solid var(--rule); color:var(--muted); font-size:11px; font-weight:700; }
        .vocab-row { position:relative; min-height:70px; border-bottom:1px solid var(--rule); }
        .vocab-row.expanded { background:var(--surface); }
        .row-star,.expand-button { display:grid; width:32px; height:32px; place-items:center; border:0; background:transparent; color:var(--muted); }
        .row-star.active { color:var(--red); }
        .word-cell strong,.word-cell small { display:block; }
        .word-cell strong { font-family:Georgia,"Noto Serif JP",serif; font-size:20px; }
        .word-cell small,.difficulty,.next-review { margin-top:3px; color:var(--muted); font-size:11px; }
        .meaning-cell { font-size:13px; }
        .mastery { font-size:11px; font-weight:700; }
        .mastery.known { color:var(--green); }
        .mastery.learning { color:var(--red); }
        .mastery.new { color:var(--muted); }
        .rotate { transform:rotate(180deg); }
        .row-details { grid-column:2 / -1; display:grid; grid-template-columns:2fr 1fr 1fr 1.3fr; gap:24px; border-top:1px solid var(--rule); padding:18px 0 22px; }
        .row-details span { color:var(--red); font-size:10px; font-weight:700; }
        .row-details p { margin:5px 0 0; font-size:13px; line-height:1.6; }
        .row-details small { color:var(--muted); }
        .evidence-detail { grid-column:1 / -1; border-top:1px solid var(--rule); padding-top:14px; }
        .source-badges { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
        .source-badges b,.source-badges em { display:inline-flex; min-height:24px; align-items:center; border-radius:999px; padding:0 9px; font-size:11px; font-style:normal; font-weight:700; }
        .source-badges b { background:var(--ink); color:white; }
        .source-badges em { background:var(--blue-soft); color:var(--blue); }
        .load-more-row { display:flex; justify-content:center; padding:22px 0 8px; }
        .empty-list { padding:60px 0; text-align:center; color:var(--muted); }
        @media(max-width:1050px) {
          .filter-bar { grid-template-columns:1fr repeat(2,130px) 42px; }
          .filter-bar select:nth-of-type(3),.filter-bar select:nth-of-type(4) { display:none; }
          .table-head { display:none; }
          .vocab-row { grid-template-columns:32px 1fr auto 32px; gap:10px; padding:12px 0; }
          .meaning-cell { grid-column:2; }
          .status-tag { grid-column:3; grid-row:1; }
          .mastery { grid-column:3; grid-row:2; }
          .difficulty,.next-review { display:none; }
          .expand-button { grid-column:4; grid-row:1 / span 2; }
          .row-details { grid-column:2 / -1; grid-template-columns:1fr 1fr; }
        }
        @media(max-width:620px) {
          .filter-bar { grid-template-columns:1fr 100px 42px; }
          .filter-bar select:nth-of-type(2) { display:none; }
          .row-details { grid-template-columns:1fr; }
        }
      `}</style>
    </AppShell>
  );
}

function statusLabel(status?: "new" | "learning" | "known") {
  if (status === "known") return "已掌握";
  if (status === "learning") return "学习中";
  return "未学习";
}

function formatDue(dueAt?: string) {
  if (!dueAt) return "—";
  const days = Math.ceil((new Date(dueAt).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "今天";
  if (days === 1) return "明天";
  return `${days}天后`;
}

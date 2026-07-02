"use client";

import { useState } from "react";
import { Eye, Star } from "lucide-react";
import type { ReviewPreview, ReviewRating } from "@/lib/scheduler/scheduler";
import { getStudyLevelMeta } from "@/lib/vocabulary/data";
import type { VocabularyEvidence } from "@/lib/vocabulary/trust";
import type { VocabularyCard } from "@/lib/vocabulary/types";

type VocabularyCardViewProps = {
  card: VocabularyCard;
  onRate: (rating: ReviewRating) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  revealed?: boolean;
  onReveal?: () => void;
  previews?: Record<ReviewRating, ReviewPreview>;
  evidence?: VocabularyEvidence;
  children?: React.ReactNode;
};

export function VocabularyCardView({
  card,
  onRate,
  isFavorite = false,
  onToggleFavorite,
  revealed: controlledRevealed,
  onReveal,
  previews,
  evidence,
  children,
}: VocabularyCardViewProps) {
  const [internalRevealed, setInternalRevealed] = useState(false);
  const revealed = controlledRevealed ?? internalRevealed;
  const levelMeta = getStudyLevelMeta(card.level);
  const hasExample = Boolean(card.exampleJa.trim() || card.exampleZh.trim());

  const reveal = () => {
    if (onReveal) onReveal();
    else setInternalRevealed(true);
  };

  return (
    <section className="word-stage">
      <div className="word-meta">
        <div>
          <span className="status-tag">{levelMeta.label}</span>
          <span>{card.partOfSpeech}</span>
        </div>
        {onToggleFavorite ? (
          <button
            type="button"
            className={isFavorite ? "favorite-button active" : "favorite-button"}
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "?????" : "?????"}
          >
            <Star size={19} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        ) : null}
      </div>

      {evidence ? (
        <div className="evidence-strip" aria-label="?????">
          <div>
            {evidence.recommendationBadges.map((badge) => <strong key={badge}>{badge}</strong>)}
            {evidence.sourceBadges.slice(0, 3).map((badge) => <span key={badge.label}>{badge.label}</span>)}
          </div>
          <p>{evidence.reason}</p>
        </div>
      ) : null}

      <div className={`word-center ${levelMeta.language}`}>
        <h1>{card.word}</h1>
        <p>{card.kana}</p>
      </div>

      {children ? <div className="study-tools">{children}</div> : null}

      <div className={revealed ? "answer-panel visible" : "answer-panel"}>
        {revealed ? (
          <>
            <p className="answer-label">{levelMeta.meaningLabel}</p>
            <h2>{card.meaningZh}</h2>
            {hasExample ? (
              <div className="example-block">
                <small>{levelMeta.exampleLabel}</small>
                <p>{card.exampleJa}</p>
                <span>{card.exampleZh}</span>
              </div>
            ) : null}
            {card.relatedWords?.length ? (
              <div className="related-words">
                <span>???</span>
                {card.relatedWords.map((word) => <b key={word}>{word}</b>)}
              </div>
            ) : null}
          </>
        ) : (
          <button type="button" className="reveal-button" onClick={reveal} aria-label="????">
            <Eye size={18} /> ???? <kbd>Space</kbd>
          </button>
        )}
      </div>

      <div className="rating-bar" aria-label="??????">
        <RatingButton rating="unknown" label="???" shortcut="1" preview={previews?.unknown.label} onRate={onRate} />
        <RatingButton rating="fuzzy" label="??" shortcut="2" preview={previews?.fuzzy.label} onRate={onRate} />
        <RatingButton rating="known" label="??" shortcut="3" preview={previews?.known.label} onRate={onRate} />
      </div>

      <style jsx>{`
        .word-stage { min-height:calc(100vh - 120px); display:flex; flex-direction:column; }
        .word-meta { display:flex; justify-content:space-between; align-items:center; min-height:40px; }
        .word-meta > div { display:flex; gap:12px; align-items:center; color:var(--muted); font-size:12px; }
        .favorite-button { display:grid; width:38px; height:38px; place-items:center; border:1px solid var(--rule); border-radius:6px; background:var(--surface); color:var(--muted); }
        .favorite-button.active { border-color:var(--red); color:var(--red); background:var(--red-soft); }
        .evidence-strip { display:grid; gap:7px; margin-top:10px; border-block:1px solid var(--rule); padding:11px 0; }
        .evidence-strip div { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
        .evidence-strip strong,.evidence-strip span { display:inline-flex; min-height:24px; align-items:center; border-radius:999px; padding:0 9px; font-size:11px; font-weight:700; }
        .evidence-strip strong { background:var(--ink); color:white; }
        .evidence-strip span { background:var(--blue-soft); color:var(--blue); }
        .evidence-strip p { margin:0; color:var(--muted); font-size:12px; line-height:1.6; }
        .word-center { display:grid; flex:1; min-height:260px; place-content:center; text-align:center; }
        .word-center h1 { margin:0; font-family:Georgia,"Noto Serif JP",serif; font-size:clamp(72px,12vw,138px); font-weight:500; line-height:.95; }
        .word-center.en h1 { max-width:min(100%,840px); overflow-wrap:anywhere; font-family:Georgia,serif; font-size:clamp(52px,9vw,112px); line-height:1; }
        .word-center p { margin:22px 0 0; color:var(--muted); font-size:clamp(22px,3vw,32px); }
        .answer-panel { min-height:174px; border-top:1px solid var(--ink); padding:24px 0; }
        .study-tools { border-top:1px solid var(--rule); }
        .answer-panel.visible { animation:answer-in .22s ease-out; }
        .answer-label { margin:0; color:var(--red); font-size:11px; font-weight:700; text-transform:uppercase; }
        .answer-panel h2 { margin:7px 0 20px; font-size:30px; }
        .example-block { border-left:3px solid var(--green); padding-left:18px; }
        .example-block small { display:block; margin-bottom:6px; color:var(--green); font-size:10px; font-weight:700; }
        .example-block p { margin:0; font-size:18px; line-height:1.8; }
        .example-block span { display:block; margin-top:5px; color:var(--muted); font-size:14px; }
        .related-words { display:flex; gap:8px; align-items:center; margin-top:18px; color:var(--muted); font-size:12px; }
        .related-words b { border:1px solid var(--rule); border-radius:999px; padding:4px 9px; color:var(--ink); }
        .reveal-button { display:flex; width:100%; min-height:78px; align-items:center; justify-content:center; gap:10px; border:0; background:transparent; color:var(--ink); font-size:16px; font-weight:700; }
        kbd { border:1px solid var(--rule); border-bottom-width:2px; border-radius:4px; padding:2px 6px; color:var(--muted); font-size:10px; }
        .rating-bar { position:sticky; z-index:25; bottom:0; display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:14px 0 0; background:var(--paper); pointer-events:auto; }
        @keyframes answer-in { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:none; } }
        @media(max-width:760px) {
          .word-stage { min-height:calc(100vh - 190px); }
          .word-center { min-height:210px; }
          .study-tools { padding-bottom:86px; }
          .answer-panel { min-height:190px; }
          .rating-bar { bottom:62px; padding-bottom:8px; }
        }
      `}</style>
    </section>
  );
}

function RatingButton({ rating, label, shortcut, preview, onRate }: {
  rating: ReviewRating;
  label: string;
  shortcut: string;
  preview?: string;
  onRate: (rating: ReviewRating) => void;
}) {
  return (
    <button
      type="button"
      className={`rating-button ${rating}`}
      onClick={() => onRate(rating)}
      aria-label={label}
    >
      <span>{label}</span>
      <small>{preview ?? "?"} ? {shortcut}</small>
      <style jsx>{`
        .rating-button { min-height:62px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); color:var(--ink); touch-action:manipulation; transition:border-color .18s ease, background .18s ease, color .18s ease, transform .18s ease, opacity .18s ease; }
        .rating-button:disabled { cursor:not-allowed; opacity:.38; }
        .rating-button:not(:disabled):hover.unknown { border-color:var(--red); background:var(--red-soft); }
        .rating-button:not(:disabled):hover.fuzzy { border-color:#a47c18; background:var(--yellow-soft); }
        .rating-button:not(:disabled):hover.known { border-color:var(--green); background:var(--green-soft); }
        .rating-button:not(:disabled):active { transform:translateY(1px) scale(.99); }
        span,small { display:block; }
        span { font-weight:700; }
        small { margin-top:4px; color:var(--muted); font-size:10px; }
      `}</style>
    </button>
  );
}

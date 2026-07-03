"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { buildMistakeBook, buildMistakeRetakePaper } from "@/lib/practice/practice";
import { getVocabularyByLevel } from "@/lib/vocabulary/data";
import { getVocabularyMeaningDisplay } from "@/lib/vocabulary/meaning";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/store/useStudyStore";

export function PracticeMistakesClient() {
  const router = useRouter();
  const settings = useStudyStore((state) => state.settings);
  const sessions = useStudyStore((state) => state.practiceSessions ?? []);
  const cards = getVocabularyByLevel(settings.level);
  const mistakeBook = buildMistakeBook(
    sessions.filter((session) => session.level === settings.level),
    cards,
  );
  const startRetake = () => {
    const paper = buildMistakeRetakePaper(mistakeBook, 10);
    if (!paper.questions.length) return;
    window.sessionStorage.setItem("kotoba-retake-paper", JSON.stringify({ paper, mode: "weak" }));
    router.push("/practice");
  };

  return (
    <AppShell>
      <div className="page-wrap mistakes-page">
        <Link href="/practice" className="text-button"><ArrowLeft size={17} /> 返回刷题</Link>
        <header className="mistakes-hero">
          <div>
            <p className="eyebrow">Mistake Book · {settings.level}</p>
            <h1 className="page-title">错题本</h1>
            <p className="muted">按历史小测中的错误次数排序，优先复盘最容易错的词。</p>
          </div>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={startRetake} disabled={!mistakeBook.length}>
              <BookOpenCheck size={16} /> 生成复训卷
            </button>
            <Link href="/study" className="secondary-button">去词卡复习</Link>
          </div>
        </header>

        {mistakeBook.length ? (
          <div className="mistake-list">
            {mistakeBook.map((item) => {
              const meaning = getVocabularyMeaningDisplay(item.card);
              return (
                <article key={item.card.id} className="mistake-row">
                  <div>
                    <strong>{item.card.word}</strong>
                    {item.card.kana ? <span>{item.card.kana}</span> : null}
                    <p>{meaning.text}</p>
                  </div>
                  <b>{item.wrongCount}</b>
                  <small>{item.lastQuestion?.stem ?? "旧历史记录暂无题干"}</small>
                  <Link href={`/library?query=${encodeURIComponent(item.card.word)}`} className="secondary-button">查词</Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p className="eyebrow">Empty</p>
            <h2>还没有错题。</h2>
            <p className="muted">完成几套 AI 小测后，这里会自动汇总薄弱词。</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .mistakes-page { max-width:980px; }
        .mistakes-hero { display:flex; justify-content:space-between; gap:20px; align-items:end; margin-top:20px; border-bottom:1px solid var(--ink); padding-bottom:24px; }
        .hero-actions { display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end; }
        button:disabled { cursor:not-allowed; opacity:.5; }
        .mistake-list { display:grid; gap:10px; margin-top:24px; }
        .mistake-row { display:grid; grid-template-columns:minmax(0,1.2fr) 70px minmax(0,1.4fr) auto; gap:16px; align-items:center; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:14px; }
        .mistake-row strong { display:block; font-family:Georgia,serif; font-size:24px; }
        .mistake-row span,.mistake-row p,.mistake-row small { color:var(--muted); font-size:12px; line-height:1.55; }
        .mistake-row p { margin:5px 0 0; }
        .mistake-row b { font-family:Georgia,serif; font-size:36px; color:var(--red); text-align:center; }
        .empty-state { margin-top:34px; border-top:1px solid var(--ink); padding-top:28px; }
        @media(max-width:720px) {
          .mistakes-hero,.hero-actions { align-items:stretch; flex-direction:column; }
          .mistake-row { grid-template-columns:1fr auto; }
          .mistake-row small { grid-column:1 / -1; }
          .mistake-row .secondary-button { grid-column:1 / -1; }
        }
      `}</style>
    </AppShell>
  );
}

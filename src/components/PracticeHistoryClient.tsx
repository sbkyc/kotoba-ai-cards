"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { buildWeakCardSummaries, isCorrectAnswer, type PracticePaper } from "@/lib/practice/practice";
import { getVocabularyByLevel } from "@/lib/vocabulary/data";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/store/useStudyStore";

export function PracticeHistoryClient() {
  const router = useRouter();
  const sessionId = useSearchParams().get("session");
  const sessions = useStudyStore((state) => state.practiceSessions ?? []);
  const session = sessions.find((item) => item.id === sessionId);
  const cards = session ? getVocabularyByLevel(session.level) : [];
  const weakCards = session?.questions ? buildWeakCardSummaries(
    session.questions.filter((question) => !isCorrectAnswer(session.answersByQuestionId?.[question.id], question)),
    cards,
  ) : [];

  const retakeSession = () => {
    if (!session?.questions?.length) return;
    const paper: PracticePaper = {
      kind: "practice-paper",
      title: `${session.title} · 重做`,
      questions: session.questions,
    };
    window.sessionStorage.setItem("kotoba-retake-paper", JSON.stringify({ paper, mode: session.mode ?? "weak" }));
    router.push("/practice");
  };

  if (!session) {
    return (
      <AppShell>
        <div className="page-wrap history-page">
          <Link href="/practice" className="text-button"><ArrowLeft size={17} /> 返回刷题</Link>
          <div className="empty-state">
            <p className="eyebrow">History</p>
            <h1 className="page-title">没有找到这次刷题记录。</h1>
            <p className="muted">记录可能已被清空，或者这是旧链接。</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-wrap history-page">
        <Link href="/practice" className="text-button"><ArrowLeft size={17} /> 返回刷题</Link>

        <header className="history-hero">
          <div>
            <p className="eyebrow">Practice Detail · {session.level}</p>
            <h1 className="page-title">{session.title}</h1>
            <p className="muted">{new Date(session.takenAt).toLocaleString("zh-CN")}</p>
          </div>
          <div className="score-box">
            <span>掌握度</span>
            <strong>{session.accuracy}%</strong>
            <small>{session.correct}/{session.total}</small>
          </div>
        </header>

        {session.questions?.length ? (
          <>
            <div className="history-actions">
              <button type="button" className="primary-button" onClick={retakeSession}>
                <RotateCcw size={16} /> 重做本套题
              </button>
              <Link href="/practice/mistakes" className="secondary-button">查看错题本</Link>
            </div>
            {weakCards.length ? (
              <section className="weak-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Mistakes</p>
                    <h2>本次薄弱词</h2>
                  </div>
                  <Link href="/study" className="secondary-button"><RotateCcw size={16} /> 去复习</Link>
                </div>
                <div className="weak-grid">
                  {weakCards.map((card) => (
                    <Link key={card.id} href={`/library?query=${encodeURIComponent(card.word)}`} className="weak-card">
                      <strong>{card.word}</strong>
                      {card.kana ? <span>{card.kana}</span> : null}
                      <small>{card.meaningZh}</small>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="question-review">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Review</p>
                  <h2>逐题回看</h2>
                </div>
              </div>
              <div className="review-list">
                {session.questions.map((question, index) => {
                  const selected = session.answersByQuestionId?.[question.id] ?? "未作答";
                  const correct = isCorrectAnswer(selected, question);
                  return (
                    <article key={question.id} className={correct ? "review-card correct" : "review-card wrong"}>
                      <div className="review-head">
                        <span>{correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />} 第 {index + 1} 题</span>
                        <strong>{question.skill}</strong>
                      </div>
                      <p>{question.stem}</p>
                      <div className="option-list">
                        {question.options.map((option) => (
                          <span key={option} className={option === selected ? "selected" : ""}>{option}</span>
                        ))}
                      </div>
                      <small>你的答案：{selected} · 正确答案：{question.answer}</small>
                      <em>{question.explanation}</em>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state">
            <p className="eyebrow">Legacy Record</p>
            <h2>这条历史只有摘要。</h2>
            <p className="muted">后续新完成的小测会自动保存逐题详情。</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .history-page { max-width:980px; }
        .history-hero { display:grid; grid-template-columns:1fr auto; gap:24px; align-items:end; margin-top:20px; border-bottom:1px solid var(--ink); padding-bottom:24px; }
        .score-box { min-width:150px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:18px; text-align:center; }
        .score-box span,.score-box small { display:block; color:var(--muted); font-size:12px; }
        .score-box strong { display:block; margin:4px 0; font-family:Georgia,serif; font-size:48px; line-height:1; }
        .history-actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:18px; }
        .section-heading { display:flex; justify-content:space-between; align-items:end; gap:16px; margin:30px 0 14px; }
        .section-heading h2 { margin:5px 0 0; font-size:24px; }
        .weak-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .weak-card { display:grid; gap:5px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:13px; color:var(--ink); text-decoration:none; }
        .weak-card:hover { border-color:var(--red); color:var(--red); }
        .weak-card span,.weak-card small { color:var(--muted); font-size:12px; line-height:1.5; }
        .review-list { display:grid; gap:12px; }
        .review-card { display:grid; gap:10px; border:1px solid var(--rule); border-left-width:4px; border-radius:6px; background:var(--surface); padding:15px; }
        .review-card.correct { border-left-color:var(--green); }
        .review-card.wrong { border-left-color:var(--red); }
        .review-head { display:flex; justify-content:space-between; gap:12px; color:var(--red); font-size:12px; font-weight:700; }
        .review-head span { display:flex; align-items:center; gap:7px; }
        .review-card p { margin:0; line-height:1.75; }
        .option-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
        .option-list span { border:1px solid var(--rule); border-radius:6px; background:var(--paper); padding:8px 10px; font-size:13px; }
        .option-list span.selected { border-color:var(--green); background:var(--green-soft); color:var(--green); font-weight:700; }
        .review-card small,.review-card em { color:var(--muted); line-height:1.65; }
        .review-card em { font-style:normal; }
        .empty-state { margin-top:34px; border-top:1px solid var(--ink); padding-top:28px; }
        @media(max-width:720px) {
          .history-hero { grid-template-columns:1fr; }
          .score-box { text-align:left; }
          .weak-grid,.option-list { grid-template-columns:1fr; }
          .section-heading { align-items:stretch; flex-direction:column; }
        }
      `}</style>
    </AppShell>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronDown, Sparkles } from "lucide-react";
import type { AiPayload } from "@/lib/ai/client";
import { CatLoader } from "@/components/CatLoader";

type AiPanelProps = {
  loading: boolean;
  error: string;
  payload: AiPayload | null;
  aiEnabled: boolean;
  revealed?: boolean;
  onAction: (action: "example" | "difference" | "quiz") => void;
  onQuizRate?: (rating: "known" | "unknown") => void;
};

export function AiPanel({ loading, error, payload, aiEnabled, revealed = false, onAction, onQuizRate }: AiPanelProps) {
  const [open, setOpen] = useState(true);
  const [revealedQuizPayload, setRevealedQuizPayload] = useState<AiPayload | null>(null);
  const isQuizAnswerVisible = payload !== null && revealedQuizPayload === payload;

  return (
    <div className="ai-tools">
      <button type="button" className="ai-toggle" onClick={() => setOpen((value) => !value)} aria-label="打开 AI 学习工具">
        <span><Sparkles size={16} /> AI 刷题与学习工具</span>
        <ChevronDown size={16} className={open ? "rotate" : ""} />
      </button>

      {open ? (
        <div className="ai-content">
          {!aiEnabled ? (
            <p className="ai-note">未填写 API Key，刷题会使用本地离线题；例句和解释需要<Link href="/settings">前往设置</Link>启用 AI。</p>
          ) : null}
          <div className="ai-actions">
            <button type="button" className="quiz-action" onClick={() => onAction("quiz")}>{aiEnabled ? "AI 刷题" : "离线刷题"}</button>
            <button type="button" disabled={!aiEnabled || !revealed} onClick={() => onAction("example")}>生成例句</button>
            <button type="button" disabled={!aiEnabled || !revealed} onClick={() => onAction("difference")}>解释区别</button>
          </div>
          {loading ? <p className="loading"><CatLoader size={15} /></p> : null}
          {error ? <p className="error"><AlertCircle size={15} /> {error}</p> : null}
          {payload ? isExamQuizPayload(payload) ? (
            <ExamQuizResult
              payload={payload}
              answerVisible={isQuizAnswerVisible}
              onRevealAnswer={() => setRevealedQuizPayload(payload)}
              onQuizRate={onQuizRate}
            />
          ) : (
            <div className="ai-result">
              {Object.entries(payload).map(([key, value]) => (
                <div key={key}>
                  <strong>{aiLabel(key)}</strong>
                  <p>{stringValue(value)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <style jsx>{`
        .ai-tools { margin-top:24px; border-top:1px solid var(--rule); }
        .ai-toggle { display:flex; width:100%; min-height:48px; align-items:center; justify-content:space-between; border:0; background:transparent; color:var(--ink); font-weight:700; }
        .ai-toggle span { display:flex; gap:8px; align-items:center; }
        .rotate { transform:rotate(180deg); }
        .ai-content { padding:4px 0 18px; }
        .ai-actions { display:flex; flex-wrap:wrap; gap:8px; }
        .ai-actions button { min-height:38px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:0 13px; font-size:12px; font-weight:700; }
        .ai-actions button:hover { border-color:var(--green); color:var(--green); }
        .ai-actions button:disabled { cursor:not-allowed; opacity:.45; }
        .ai-actions .quiz-action { border-color:var(--red); background:var(--red-soft); color:var(--red); }
        .ai-note { margin:8px 0; color:var(--muted); font-size:13px; line-height:1.65; }
        .ai-note a { margin:0 3px; color:var(--red); font-weight:700; }
        .loading,.error { display:flex; align-items:center; gap:7px; margin:8px 0; color:var(--muted); font-size:13px; }
        .error { color:var(--red); }
        .ai-result { display:grid; gap:12px; margin-top:16px; }
        .ai-result div { border-left:2px solid var(--red); padding-left:12px; }
        .ai-result strong { color:var(--red); font-size:11px; }
        .ai-result p { margin:4px 0 0; white-space:pre-wrap; line-height:1.7; }
      `}</style>
    </div>
  );
}

function ExamQuizResult({
  payload,
  answerVisible,
  onRevealAnswer,
  onQuizRate,
}: {
  payload: AiPayload;
  answerVisible: boolean;
  onRevealAnswer: () => void;
  onQuizRate?: (rating: "known" | "unknown") => void;
}) {
  const options = Array.isArray(payload.options) ? payload.options.map(String) : [];

  return (
    <div className="exam-quiz">
      <div className="quiz-meta">
        <span>{stringValue(payload.examSection)}</span>
        <span>{stringValue(payload.questionType)}</span>
      </div>
      <p className="quiz-question">{stringValue(payload.question)}</p>
      {options.length ? (
        <ol className="quiz-options">
          {options.map((option) => <li key={option}>{option}</li>)}
        </ol>
      ) : null}
      {answerVisible ? (
        <div className="quiz-answer">
          <div>
            <strong>{aiLabel("answer")}</strong>
            <p>{stringValue(payload.answer)}</p>
          </div>
          {onQuizRate ? (
            <div className="quiz-feedback" aria-label="AI刷题结果记录">
              <button type="button" onClick={() => onQuizRate("known")}>答对了</button>
              <button type="button" onClick={() => onQuizRate("unknown")}>答错了</button>
            </div>
          ) : null}
          <div>
            <strong>{aiLabel("explanation")}</strong>
            <p>{stringValue(payload.explanation)}</p>
          </div>
          {payload.memoryCheck ? (
            <div>
              <strong>{aiLabel("memoryCheck")}</strong>
              <p>{stringValue(payload.memoryCheck)}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <button type="button" className="secondary-button" onClick={onRevealAnswer}>显示答案和解析</button>
      )}
      <style jsx>{`
        .exam-quiz { display:grid; gap:12px; margin-top:16px; border:1px solid var(--rule); border-radius:6px; background:var(--surface); padding:14px; }
        .quiz-meta { display:flex; flex-wrap:wrap; gap:8px; color:var(--red); font-size:11px; font-weight:700; }
        .quiz-question { margin:0; font-size:15px; line-height:1.7; }
        .quiz-options { display:grid; gap:7px; margin:0; padding:0; list-style:none; }
        .quiz-options li { border:1px solid var(--rule); border-radius:6px; padding:8px 10px; background:var(--paper); font-size:13px; }
        .quiz-answer { display:grid; gap:10px; border-top:1px solid var(--rule); padding-top:12px; }
        .quiz-answer div { border-left:2px solid var(--green); padding-left:12px; }
        .quiz-answer strong { color:var(--green); font-size:11px; }
        .quiz-answer p { margin:4px 0 0; white-space:pre-wrap; line-height:1.7; }
        .quiz-feedback { display:flex; flex-wrap:wrap; gap:8px; border-left:0 !important; padding-left:0 !important; }
        .quiz-feedback button { min-height:38px; border:1px solid var(--rule); border-radius:6px; background:var(--paper); padding:0 14px; font-size:12px; font-weight:700; }
        .quiz-feedback button:first-child { border-color:var(--green); color:var(--green); }
        .quiz-feedback button:last-child { border-color:var(--red); color:var(--red); }
      `}</style>
    </div>
  );
}

function isExamQuizPayload(payload: AiPayload): boolean {
  return payload.kind === "exam-quiz" || ("question" in payload && "options" in payload && "answer" in payload);
}

function stringValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join("\n");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return value === undefined || value === null ? "" : String(value);
}

function aiLabel(key: string) {
  const labels: Record<string, string> = {
    answer: "答案",
    commonMistake: "常见误用",
    exampleJa: "日语例句",
    exampleZh: "中文翻译",
    explanation: "解释",
    memoryCheck: "记忆检测",
    options: "选项",
    question: "问题",
    raw: "原始输出",
    usageComparison: "用法比较",
    usageNote: "用法提示",
  };
  return labels[key] ?? key;
}

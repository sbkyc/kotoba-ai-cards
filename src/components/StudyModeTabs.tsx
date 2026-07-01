"use client";

import type { StudyMode } from "@/lib/study/queue";

const modeOptions: { value: StudyMode; label: string; description: string }[] = [
  { value: "daily", label: "今日计划", description: "到期复习和新词" },
  { value: "difficult", label: "错题优先", description: "模糊和不认识" },
  { value: "favorites", label: "重点词", description: "手动收藏词" },
];

type StudyModeTabsProps = {
  value: StudyMode;
  onChange: (mode: StudyMode) => void;
};

export function StudyModeTabs({ value, onChange }: StudyModeTabsProps) {
  return (
    <div className="mode-tabs" aria-label="学习模式">
      {modeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "active" : ""}
          aria-label={option.label}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          <span>{option.label}</span>
          <small>{option.description}</small>
        </button>
      ))}
    </div>
  );
}

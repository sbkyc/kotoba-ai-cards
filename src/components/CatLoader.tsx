"use client";

import { Cat } from "lucide-react";

type CatLoaderProps = {
  label?: string;
  size?: number;
};

export function CatLoader({ label = "小猫正在生成", size = 16 }: CatLoaderProps) {
  return (
    <span className="cat-loader" role="status" aria-label="小猫加载中">
      <Cat size={size} aria-hidden="true" />
      {label ? <span>{label}</span> : null}
      <style jsx>{`
        .cat-loader { display:inline-flex; align-items:center; gap:7px; }
        .cat-loader :global(svg) {
          flex:0 0 auto;
          animation:cat-breathe 1.8s ease-in-out infinite;
          transform-origin:center bottom;
        }
        @keyframes cat-breathe {
          0%,100% { opacity:.7; transform:translateY(0) rotate(-2deg); }
          50% { opacity:1; transform:translateY(-2px) rotate(2deg); }
        }
      `}</style>
    </span>
  );
}

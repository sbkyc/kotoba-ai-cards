"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, BrainCircuit, CalendarDays, Library, Settings } from "lucide-react";
import { getStudyLevelMeta } from "@/lib/vocabulary/data";
import { useStudyStore } from "@/store/useStudyStore";

const navItems = [
  { href: "/", label: "今日", icon: CalendarDays },
  { href: "/study", label: "学习", icon: BookOpenText },
  { href: "/practice", label: "刷题", icon: BrainCircuit },
  { href: "/library", label: "词库", icon: Library },
  { href: "/settings", label: "设置", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const level = useStudyStore((state) => state.settings.level);
  const levelMeta = getStudyLevelMeta(level);

  return (
    <div className="app-frame">
      <aside className="desktop-rail">
        <Link href="/" className="brand-lockup" aria-label="Kotoba AI Cards 首页">
          <span className="brand-mark">言</span>
          <span>
            <strong>Kotoba</strong>
            <small>AI Cards</small>
          </span>
        </Link>

        <nav className="rail-nav" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={active ? "rail-link active" : "rail-link"}>
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rail-level">
          <span>当前词库</span>
          <strong>{levelMeta.label}</strong>
        </div>
      </aside>

      <header className="mobile-header">
        <Link href="/" className="mobile-brand">
          <span className="brand-mark">言</span>
          <strong>Kotoba</strong>
        </Link>
        <span className="level-tag">{levelMeta.label}</span>
      </header>

      <main className="app-content">{children}</main>

      <nav className="mobile-nav" aria-label="移动端导航">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={active ? "mobile-link active" : "mobile-link"}>
              <Icon size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

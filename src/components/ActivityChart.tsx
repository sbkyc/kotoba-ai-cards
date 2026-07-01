import type { DailyActivity } from "@/lib/activity/activity";

export function ActivityChart({ data }: { data: DailyActivity[] }) {
  const max = Math.max(...data.map((day) => day.count), 1);

  return (
    <div className="activity-chart" aria-label="最近七天学习活动">
      {data.map((day) => (
        <div key={day.date} className="activity-day">
          <div className="activity-bar-track">
            <div className="activity-bar" style={{ height: `${Math.max((day.count / max) * 100, day.count ? 14 : 2)}%` }} />
          </div>
          <span>{formatDay(day.date)}</span>
          <strong>{day.count}</strong>
        </div>
      ))}
      <style jsx>{`
        .activity-chart { display:grid; grid-template-columns:repeat(7,1fr); gap:10px; min-height:190px; border-top:1px solid var(--ink); padding-top:18px; }
        .activity-day { display:grid; grid-template-rows:1fr auto auto; gap:5px; text-align:center; }
        .activity-bar-track { display:flex; min-height:115px; align-items:flex-end; justify-content:center; border-bottom:1px solid var(--rule); }
        .activity-bar { width:min(28px,70%); background:var(--green); transition:height .3s ease; }
        span { color:var(--muted); font-size:10px; }
        strong { font-family:Georgia,serif; font-size:14px; }
      `}</style>
    </div>
  );
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

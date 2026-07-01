type StatCardProps = {
  label: string;
  value: string | number;
  tone?: "pink" | "green" | "ink";
};

const toneClass = {
  pink: "bg-[#f9dfe3] text-[#7c3f4b]",
  green: "bg-[#dcead2] text-[#35513c]",
  ink: "bg-[#ece1d3] text-[#514539]",
};

export function StatCard({ label, value, tone = "ink" }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-[#eadfd2] bg-[#fffaf3] p-5">
      <p className="text-sm font-medium text-[#7b6f64]">{label}</p>
      <p className={`mt-4 inline-flex rounded-2xl px-4 py-2 text-3xl font-bold ${toneClass[tone]}`}>{value}</p>
    </div>
  );
}

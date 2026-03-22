import Link from "next/link";

type Accent = "default" | "emerald" | "orange" | "red" | "blue";

const accentStyles: Record<Accent, { bg: string; label: string; value: string }> = {
  default: { bg: "bg-white", label: "text-gray-500", value: "text-gray-900" },
  emerald: { bg: "bg-emerald-50", label: "text-emerald-600", value: "text-emerald-700" },
  orange: { bg: "bg-orange-50", label: "text-orange-600", value: "text-orange-700" },
  red: { bg: "bg-red-50", label: "text-red-600", value: "text-red-700" },
  blue: { bg: "bg-blue-50", label: "text-blue-600", value: "text-blue-700" },
};

interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    text: string;
    type: "positive" | "negative" | "neutral";
  };
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  accent?: Accent;
  muted?: boolean;
}

export function StatCard({
  label,
  value,
  change,
  subtitle,
  href,
  hrefLabel,
  accent = "default",
  muted = false,
}: StatCardProps) {
  const styles = accentStyles[accent];
  const changeBg =
    change?.type === "positive"
      ? "bg-green-100 text-green-700"
      : change?.type === "negative"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-500";

  return (
    <div className={`rounded-xl ring-1 ring-inset ring-gray-200 px-4 py-3.5 ${styles.bg}`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-xs font-medium ${styles.label}`}>{label}</p>
        {change && (
          <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${changeBg}`}>
            {change.text}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <p className={`text-xl font-semibold ${muted ? "text-gray-400" : styles.value}`}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors mt-2 inline-block"
        >
          {hrefLabel || "View"} →
        </Link>
      )}
    </div>
  );
}

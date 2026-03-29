import { ReactNode } from "react";

type ManagerMetricCardProps = {
  label: string;
  value: string;
  icon: string;
  helper?: string;
  suffix?: string;
  badge?: ReactNode;
  className?: string;
  iconWrapClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export default function ManagerMetricCard({
  label,
  value,
  icon,
  helper,
  suffix,
  badge,
  className = "",
  iconWrapClassName = "bg-[var(--primary)]/10 text-[var(--primary)]",
  iconClassName = "",
  labelClassName = "text-stone-500",
  valueClassName = "text-[var(--foreground)]",
}: ManagerMetricCardProps) {
  return (
    <article className={`flex h-full flex-col justify-between rounded-2xl border border-stone-200/60 bg-white p-6 shadow-[0_10px_30px_rgba(46,50,48,0.06)] ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconWrapClassName}`}>
          <span className={`material-symbols-outlined ${iconClassName}`}>{icon}</span>
        </div>
        {badge}
      </div>

      <div className="mt-5">
        <p className={`text-sm font-medium ${labelClassName}`}>{label}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <h3 className={`text-3xl font-bold ${valueClassName}`}>{value}</h3>
          {suffix ? <span className="text-sm font-medium text-stone-400">{suffix}</span> : null}
        </div>
        {helper ? <p className="mt-2 text-sm text-stone-500">{helper}</p> : null}
      </div>
    </article>
  );
}
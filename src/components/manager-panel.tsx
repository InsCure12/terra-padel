import { ReactNode } from "react";

type ManagerPanelProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function ManagerPanel({ title, subtitle, action, className = "", children }: ManagerPanelProps) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-[0_10px_30px_rgba(46,50,48,0.06)] ${className}`}>
      {title || subtitle || action ? (
        <div className="flex items-center justify-between gap-4 border-b border-stone-100 px-6 py-5">
          <div>
            {title ? <h3 className="text-lg font-bold text-[var(--foreground)]">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
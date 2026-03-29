import Link from "next/link";
import { ReactNode } from "react";
import ManagerFooter from "@/components/manager-footer";

type ManagerTab = "overview" | "schedule" | "inventory" | "analytics";

type ManagerShellProps = {
  activeTab: ManagerTab;
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
};

const tabs: Array<{ key: ManagerTab; label: string; href: string; icon: string }> = [
  { key: "overview", label: "Overview", href: "/manager/overview", icon: "dashboard" },
  { key: "schedule", label: "Schedule", href: "/manager/schedule", icon: "calendar_today" },
  { key: "inventory", label: "Inventory", href: "/manager/inventory", icon: "inventory_2" },
  { key: "analytics", label: "Analytics", href: "/manager/analytics", icon: "analytics" },
];

export default function ManagerShell({ activeTab, title, subtitle, children, actions }: ManagerShellProps) {
  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#2e3230]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 border-r border-stone-200/70 bg-[#faf6f0] md:flex">
        <div className="flex h-full w-full flex-col p-4">
          <div className="mb-8 px-4 py-5">
            <h2 className="text-xl font-bold text-[var(--primary)]">Terra Padel</h2>
            <p className="text-xs tracking-wide text-stone-500">Club Management</p>
          </div>

          <nav className="flex-1 space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                    isActive
                      ? "translate-x-1 rounded-2xl border-r-4 border-[var(--primary)] bg-[var(--primary)]/10 font-bold text-[var(--primary)]"
                      : "rounded-2xl text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <span className={`material-symbols-outlined ${isActive ? "fill-icon" : ""}`}>{tab.icon}</span>
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-1 border-t border-stone-200/70 pt-4">
            <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-stone-600 transition-colors hover:bg-stone-100">
              <span className="material-symbols-outlined">help</span>
              Support
            </button>
            <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-stone-600 transition-colors hover:bg-stone-100">
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#faf6f0]/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-sm text-stone-500">{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">{actions}</div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-6 md:px-8">{children}</div>
        <ManagerFooter />
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import ManagerMetricCard from "@/components/manager-metric-card";
import ManagerPanel from "@/components/manager-panel";
import ManagerShell from "@/components/manager-shell";

type AnalyticsResponse = {
  data: {
    metrics: {
      totalBookings: number;
      bookingGrowthPct: number;
      newCustomers: number;
      totalRevenue: number;
      topCourt: { name: string; rating: number };
    };
    revenueByWeek: Array<{ week: number; revenue: number }>;
    utilizationByHour: Array<{ hour: number; count: number }>;
    inventory: { lowStockItems: number };
  };
};

function buildLinePath(points: Array<{ week: number; revenue: number }>, maxRevenue: number): { linePath: string; areaPath: string } {
  if (points.length === 0) return { linePath: "", areaPath: "" };
  const n = points.length;
  const coords = points.map((p, i) => ({
    x: n === 1 ? 400 : (i / (n - 1)) * 800,
    y: 180 - Math.max((p.revenue / Math.max(maxRevenue, 1)) * 160, 0),
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)} 180 L${coords[0].x.toFixed(1)} 180 Z`;
  return { linePath, areaPath };
}

function fmtRevenue(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n}`;
}

export default function ManagerAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"Monthly" | "Quarterly" | "Yearly">("Monthly");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/manager/analytics", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load analytics");
        const json: AnalyticsResponse = await res.json();
        setData(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const maxRevenue = useMemo(
    () => Math.max(...(data?.revenueByWeek.map((p) => p.revenue) ?? [1]), 1),
    [data]
  );
  const maxUtilization = useMemo(
    () => Math.max(...(data?.utilizationByHour.map((p) => p.count) ?? [1]), 1),
    [data]
  );

  const { linePath, areaPath } = useMemo(
    () => buildLinePath(data?.revenueByWeek ?? [], maxRevenue),
    [data, maxRevenue]
  );

  const topUtilHours = useMemo(
    () => [...(data?.utilizationByHour ?? [])].sort((a, b) => b.count - a.count).slice(0, 9),
    [data]
  );

  const periodLabel = data
    ? `Detailed breakdown of Terra Padel operations — ${period.toLowerCase()} view.`
    : "Loading performance data…";

  return (
    <ManagerShell
      activeTab="analytics"
      title="Club Performance"
      subtitle={periodLabel}
      actions={
        <div className="flex items-center gap-1 rounded-lg bg-[var(--surface-container-high)] p-1">
          {(["Monthly", "Quarterly", "Yearly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                period === p ? "bg-white shadow-sm text-[var(--primary)]" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-500">
          <span className="material-symbols-outlined mr-2 animate-spin">refresh</span>
          Loading analytics…
        </div>
      ) : null}
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <ManagerMetricCard
              label="Total Bookings"
              value={data.metrics.totalBookings.toLocaleString()}
              helper="Latest period volume across all courts"
              icon="event_available"
              iconWrapClassName="bg-[var(--primary)]/10 text-[var(--primary)]"
              badge={<span className="rounded bg-[var(--primary)]/5 px-2 py-1 text-xs font-bold text-[var(--primary)]">+{data.metrics.bookingGrowthPct.toFixed(1)}%</span>}
              className="bg-[var(--surface-container-low)] hover:border-[var(--primary)]/50"
            />

            <ManagerMetricCard
              label="New Customers"
              value={data.metrics.newCustomers.toLocaleString()}
              helper="New player acquisition in the selected view"
              icon="person_add"
              iconWrapClassName="bg-[var(--tertiary)]/10 text-[var(--tertiary)]"
              badge={<span className="rounded bg-[var(--tertiary)]/5 px-2 py-1 text-xs font-bold text-[var(--tertiary)]">Active</span>}
              className="bg-[var(--surface-container-low)] hover:border-[var(--primary)]/50"
            />

            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--primary)] bg-[var(--primary)] p-6 text-white shadow-[0_10px_30px_rgba(46,50,48,0.06)]">
              <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[120px]">sports_tennis</span>
              </div>
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-white/20 p-3">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <span className="rounded bg-white/10 px-2 py-1 text-xs font-bold">
                  {data.metrics.topCourt.rating.toFixed(1)} / 5
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-sm text-[var(--primary-container)]">Top Rated Court</p>
                <h3 className="text-2xl font-bold">{data.metrics.topCourt.name}</h3>
              </div>
            </div>
          </div>

          {/* Revenue chart + Demographics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Revenue Growth Line Chart */}
            <ManagerPanel title="Revenue Growth" subtitle="Net earnings from court rentals" className="bg-[var(--surface-container-low)] lg:col-span-8">
              <div className="mb-8 flex items-start justify-between">
                <div className="text-right">
                  <span className="text-2xl font-bold text-[var(--primary)]">{fmtRevenue(data.metrics.totalRevenue)}</span>
                  <p className="text-xs text-stone-400">Month-to-date</p>
                </div>
              </div>
              <div className="relative h-56 w-full">
                <svg className="h-full w-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4a7c59" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#4a7c59" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="180" x2="800" y2="180" stroke="#e4e0d8" strokeWidth="1" />
                  <line x1="0" y1="120" x2="800" y2="120" stroke="#f0ece4" strokeWidth="1" />
                  <line x1="0" y1="60" x2="800" y2="60" stroke="#f0ece4" strokeWidth="1" />
                  {areaPath && <path d={areaPath} fill="url(#revenueGradient)" opacity="0.4" />}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#4a7c59"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {data.revenueByWeek.map((point, i) => {
                    const n = data.revenueByWeek.length;
                    const x = n === 1 ? 400 : (i / (n - 1)) * 800;
                    const y = 180 - Math.max((point.revenue / maxRevenue) * 160, 0);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={i === data.revenueByWeek.length - 1 ? 6 : 4}
                        fill="#4a7c59"
                        stroke={i === data.revenueByWeek.length - 1 ? "white" : "none"}
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="mt-4 flex justify-between text-xs text-stone-400">
                {data.revenueByWeek.map((p) => (
                  <span key={p.week}>W{p.week}</span>
                ))}
              </div>
            </ManagerPanel>

            <ManagerPanel title="Booking Status" subtitle="Current month distribution" className="bg-[var(--surface-container-low)] lg:col-span-4">
              <div className="flex flex-1 flex-col items-center justify-center gap-6">
                <div className="relative h-40 w-40">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f0e8db" strokeWidth="4" />
                    <circle
                      cx="18" cy="18" r="16" fill="transparent"
                      stroke="#4a7c59" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${data.metrics.totalBookings > 0 ? (data.metrics.totalBookings / Math.max(data.metrics.totalBookings, 1)) * 60 : 0} 100`}
                    />
                    <circle
                      cx="18" cy="18" r="16" fill="transparent"
                      stroke="#705c30" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray="25 100" strokeDashoffset="-60"
                    />
                    <circle
                      cx="18" cy="18" r="16" fill="transparent"
                      stroke="#c4a66a" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray="15 100" strokeDashoffset="-85"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold">{data.metrics.totalBookings}</span>
                    <span className="text-[10px] uppercase tracking-widest text-stone-400">Total</span>
                  </div>
                </div>
                <div className="grid w-full grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[var(--primary)]" />
                    <span className="text-sm text-stone-600">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[var(--tertiary)]" />
                    <span className="text-sm text-stone-600">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[var(--tertiary-container)]" />
                    <span className="text-sm text-stone-600">Cancelled</span>
                  </div>
                </div>
              </div>
            </ManagerPanel>
          </div>

          <ManagerPanel title="Peak Utilization Times" subtitle="Hourly average occupancy across all courts" className="bg-[var(--surface-container-low)]">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <select className="rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container)] px-3 py-1.5 text-sm focus:ring-[var(--primary)]">
                <option>All Courts</option>
              </select>
            </div>
            <div className="grid items-end gap-2 h-48" style={{ gridTemplateColumns: `repeat(${topUtilHours.length}, 1fr) 3fr` }}>
              {topUtilHours.map((point) => {
                const pct = Math.max((point.count / maxUtilization) * 100, 6);
                const isPeak = point.count === maxUtilization;
                return (
                  <div key={point.hour} className="group flex flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t-lg transition-colors ${isPeak ? "bg-[var(--primary)]" : "bg-[var(--primary)]/20 group-hover:bg-[var(--primary)]"}`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className={`text-[10px] font-semibold ${isPeak ? "text-[var(--primary)]" : "text-stone-400"}`}>
                      {String(point.hour).padStart(2, "0")}:00
                    </span>
                  </div>
                );
              })}
              <div className="ml-4 flex h-full items-center justify-center border-l border-[var(--outline-variant)]/30 pl-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--on-surface)]">{data.utilizationByHour.length > 0
                    ? `${Math.round((data.utilizationByHour.reduce((sum, p) => sum + p.count, 0) / data.utilizationByHour.length) / Math.max(maxUtilization, 1) * 100)}%`
                    : "—"}</p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">Avg Daily Occupancy</p>
                </div>
              </div>
            </div>
          </ManagerPanel>

          {/* Action highlights */}
          <div className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-2">
            <div className="flex items-center gap-6 rounded-xl bg-[var(--secondary-container)] p-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)]/20">
                <span className="material-symbols-outlined text-5xl text-[var(--on-secondary-container)]">inventory_2</span>
              </div>
              <div>
                <h5 className="text-lg font-bold text-[var(--on-secondary-container)]">Inventory Warning</h5>
                <p className="mt-1 text-sm text-[var(--on-secondary-container)]/70">
                  {data.inventory.lowStockItems} item(s) are running low based on current booking velocity.
                </p>
                <button className="group mt-3 flex items-center gap-1 text-sm font-bold text-[var(--primary)]">
                  Restock Inventory
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-6 rounded-xl bg-[var(--surface-container-highest)] p-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-[var(--tertiary-container)]">
                <span className="material-symbols-outlined text-4xl text-[var(--on-tertiary-container)]">celebration</span>
              </div>
              <div>
                <h5 className="text-lg font-bold text-[var(--on-tertiary-container)]">Top Performance</h5>
                <p className="mt-1 text-sm text-[var(--on-tertiary-container)]/70">
                  {data.metrics.topCourt.name} is your highest rated court with a {data.metrics.topCourt.rating.toFixed(1)} star average.
                </p>
                <button className="group mt-3 flex items-center gap-1 text-sm font-bold text-[var(--tertiary)]">
                  View Leaderboard
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ManagerShell>
  );
}


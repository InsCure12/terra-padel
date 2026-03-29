"use client";

import { useEffect, useMemo, useState } from "react";
import ManagerMetricCard from "@/components/manager-metric-card";
import ManagerPanel from "@/components/manager-panel";
import ManagerShell from "@/components/manager-shell";

type OverviewResponse = {
  data: {
    metrics: {
      totalRevenue: number;
      totalCommission: number;
      upcomingBookings: number;
      averageRating: number;
      totalReviews: number;
    };
    recentBookings: Array<{
      id: string;
      startTime: string;
      endTime: string;
      status: "pending" | "confirmed" | "cancelled";
      courtName: string;
      playerName: string;
      playerEmail: string;
    }>;
    courtStatuses: Array<{
      id: string;
      name: string;
      location: string;
      occupied: boolean;
    }>;
  };
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function statusUi(status: "pending" | "confirmed" | "cancelled") {
  if (status === "confirmed") {
    return {
      label: "Confirmed",
      badgeClass: "bg-green-50 text-[var(--primary)] border-[var(--primary)]/10",
    };
  }
  if (status === "pending") {
    return {
      label: "Pending",
      badgeClass: "bg-amber-50 text-[var(--tertiary)] border-[var(--tertiary)]/10",
    };
  }
  return {
    label: "Cancelled",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString([], {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTimeRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function ManagerOverviewPage() {
  const [data, setData] = useState<OverviewResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/manager/overview", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load manager overview");
        }
        const json: OverviewResponse = await response.json();
        setData(json.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load manager overview");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const metricCards = useMemo(
    () => [
      {
        icon: "payments",
        label: "Total Revenue",
        value: `$${(data?.metrics.totalRevenue ?? 0).toLocaleString()}`,
        helper: `$${(data?.metrics.totalCommission ?? 0).toLocaleString()} commission retained`,
        iconWrapClassName: "bg-[var(--primary)]/10 text-[var(--primary)]",
      },
      {
        icon: "event_available",
        label: "Upcoming Bookings",
        value: String(data?.metrics.upcomingBookings ?? 0),
        helper: "Confirmed and pending slots coming up next",
        iconWrapClassName: "bg-[var(--tertiary)]/10 text-[var(--tertiary)]",
      },
      {
        icon: "star",
        label: "Average Rating",
        value: (data?.metrics.averageRating ?? 0).toFixed(1),
        suffix: "/ 5.0",
        helper: `${data?.metrics.totalReviews ?? 0} total reviews across courts`,
        iconWrapClassName: "bg-amber-50 text-amber-500",
        iconClassName: "fill-icon",
      },
    ],
    [data]
  );

  const availabilitySummary = useMemo(() => {
    const total = data?.courtStatuses.length ?? 0;
    const occupied = (data?.courtStatuses ?? []).filter((item) => item.occupied).length;
    const available = Math.max(total - occupied, 0);
    return { total, occupied, available };
  }, [data]);

  return (
    <ManagerShell
      activeTab="overview"
      title="Operations Overview"
      subtitle="Track revenue, live court usage, and the next bookings from one view."
      actions={
        <>
          <button className="flex items-center gap-2 rounded-lg border border-stone-200/70 bg-[#f5f1ea] px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-[#f0ece4]">
            <span className="material-symbols-outlined text-lg text-[var(--primary)]">calendar_month</span>
            This week
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 font-bold text-white shadow-[0_4px_20px_rgba(74,124,89,0.2)] transition-opacity hover:opacity-90">
            <span className="material-symbols-outlined text-lg">add</span>
            New Booking
          </button>
        </>
      }
    >
      <div className="space-y-8">
          {loading ? <p className="text-sm text-stone-500">Loading overview...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            {metricCards.map((card) => (
              <ManagerMetricCard
                key={card.label}
                {...card}
                suffix={card.suffix}
                helper={card.helper}
                iconWrapClassName={card.iconWrapClassName}
                iconClassName={card.iconClassName}
              />
            ))}

            <ManagerMetricCard
              label="Court Availability"
              value={`${availabilitySummary.available}/${availabilitySummary.total}`}
              suffix="open now"
              helper={`${availabilitySummary.occupied} currently occupied`}
              icon="sports_tennis"
              iconWrapClassName="bg-[var(--secondary-container)] text-[var(--primary)]"
              badge={<span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-bold text-[var(--primary)]">Live</span>}
              className="bg-[linear-gradient(135deg,#ffffff_0%,#f5f1ea_100%)]"
            />
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <ManagerPanel
              title="Recent Bookings"
              subtitle="Latest 8 reservations across your club"
              action={<p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">Live feed</p>}
              className="lg:col-span-8"
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#f5f1ea]/50">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Player Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Date and Time</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Court</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {(data?.recentBookings ?? []).length === 0 ? (
                      <tr>
                        <td className="px-6 py-8 text-sm text-stone-500" colSpan={4}>
                          No bookings yet.
                        </td>
                      </tr>
                    ) : null}
                    {(data?.recentBookings ?? []).map((booking) => {
                      const bookingStatus = statusUi(booking.status);
                      return (
                        <tr key={booking.id} className="transition-colors hover:bg-stone-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c8e8d0] text-[10px] font-bold text-[#002110]">
                                {getInitials(booking.playerName)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{booking.playerName}</span>
                                <span className="text-xs text-stone-500">{booking.playerEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{formatDate(booking.startTime)}</span>
                              <span className="text-xs text-stone-400">{formatTimeRange(booking.startTime, booking.endTime)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-stone-600">{booking.courtName}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${bookingStatus.badgeClass}`}>
                              {bookingStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ManagerPanel>

            <aside className="flex flex-col gap-6 lg:col-span-4">
              <ManagerPanel title="Court Status" subtitle="Live availability by location" className="bg-[#faf6f0]">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                    <span className="text-[10px] font-bold uppercase text-stone-500">Live</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {(data?.courtStatuses ?? []).length === 0 ? (
                    <p className="rounded-xl border border-stone-100 bg-white p-4 text-sm text-stone-500">
                      No courts configured yet.
                    </p>
                  ) : null}
                  {(data?.courtStatuses ?? []).map((item) => (
                    <article
                      key={item.id}
                      className="group flex items-center justify-between rounded-xl border border-stone-100 bg-white p-4 transition-all hover:border-[var(--primary)]/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[var(--primary)]/40 transition-colors group-hover:text-[var(--primary)]">
                          sports_tennis
                        </span>
                        <div>
                          <p className="text-sm font-bold">{item.name}</p>
                          <p className="text-[10px] text-stone-400">{item.location}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                          item.occupied
                            ? "bg-[var(--primary)] text-white"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {item.occupied ? "Occupied" : "Available"}
                      </span>
                    </article>
                  ))}
                </div>

                <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-3 text-sm font-bold text-stone-400 transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Manage Courts
                </button>
              </ManagerPanel>

              <section className="group relative overflow-hidden rounded-xl bg-[var(--primary)] p-6 text-white">
                <div className="relative z-10">
                  <h4 className="mb-1 text-lg font-bold">Need help?</h4>
                  <p className="mb-4 text-xs leading-relaxed opacity-80">
                    Reach out to our dedicated support team for operational assistance.
                  </p>
                  <button className="rounded-lg bg-white/20 px-4 py-2 text-xs font-bold backdrop-blur-sm transition-colors hover:bg-white/30">
                    Contact Support
                  </button>
                </div>
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 rotate-12 text-8xl opacity-10 transition-transform duration-500 group-hover:rotate-0">
                  support_agent
                </span>
              </section>
            </aside>
          </div>
      </div>
    </ManagerShell>
  );
}
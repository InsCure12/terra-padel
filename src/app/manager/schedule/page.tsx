"use client";

import { useEffect, useMemo, useState } from "react";
import ManagerShell from "@/components/manager-shell";

type Court = {
  id: string;
  name: string;
  location: string;
};

type Booking = {
  id: string;
  courtId: string;
  playerName: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "cancelled";
};

type ScheduleData = {
  date: string;
  courts: Court[];
  bookings: Booking[];
  stats: {
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    occupancy: number;
  };
};

const START_HOUR = 7;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const ROW_H = 80;

function fmtHour(hour: number) {
  const ampm = hour >= 12 ? "PM" : "AM";
  const d = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${String(d).padStart(2, "0")}:00 ${ampm}`;
}

function bookingHeightPx(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hrs = ms / 3_600_000;
  return Math.max(hrs * ROW_H - 8, ROW_H * 0.6);
}

const STATUS_STYLES = {
  confirmed: "border-[var(--primary)] bg-[var(--primary-fixed)]/40",
  pending: "border-[var(--tertiary)] bg-[var(--tertiary-fixed)]/30 border-dashed border-2",
  cancelled: "border-stone-400 bg-stone-100",
} as const;

const STATUS_BADGE = {
  confirmed: "bg-[var(--primary)] text-white",
  pending: "bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]",
  cancelled: "bg-stone-300 text-stone-600",
} as const;

export default function ManagerSchedulePage() {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/manager/schedule", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load schedule data");
        const json = (await res.json()) as { data: ScheduleData };
        setData(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load schedule data");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const bookingsByCourt = useMemo(() => {
    const map = new Map<string, Booking[]>();
    data?.bookings.forEach((b) => {
      const list = map.get(b.courtId) ?? [];
      list.push(b);
      map.set(b.courtId, list);
    });
    return map;
  }, [data]);

  const displayDate = data
    ? new Date(data.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Today";

  const courtCount = data?.courts.length ?? 1;
  const gridCols = `100px repeat(${courtCount}, minmax(0, 1fr))`;

  return (
    <ManagerShell
      activeTab="schedule"
      title="Schedule"
      subtitle="Real-time court calendar and booking operations"
      actions={
        <button className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-sm">add</span>
          New Booking
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-[var(--on-surface)]">{displayDate}</h2>
            <div className="flex items-center rounded-lg bg-[var(--surface-container-high)] p-1">
              <button className="rounded-md bg-white px-4 py-1.5 text-sm font-bold text-[var(--primary)] shadow-sm">Day</button>
              <button className="rounded-md px-4 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100/50 transition-colors">Week</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(data?.courts ?? []).slice(0, 3).map((court, i) => {
              const colors = [
                "bg-[var(--primary-fixed)] text-[var(--primary)]",
                "bg-[var(--secondary-fixed)] text-[var(--secondary)]",
                "bg-[var(--tertiary-fixed)] text-[var(--tertiary)]",
              ];
              return (
                <button
                  key={court.id}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--surface)] text-xs font-bold hover:z-10 transition-all ${colors[i]}`}
                >
                  C{i + 1}
                </button>
              );
            })}
            {(data?.courts.length ?? 0) > 3 && (
              <button className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--surface-container-highest)] text-xs font-bold text-stone-500">
                +{(data?.courts.length ?? 0) - 3}
              </button>
            )}
            <button className="flex items-center gap-2 rounded-full border border-[var(--outline-variant)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-container-low)] transition-colors">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filter Courts
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-stone-500">
            <span className="material-symbols-outlined mr-2 animate-spin">refresh</span>
            Loading schedule…
          </div>
        ) : null}
        {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {data ? (
          <>
            {/* Schedule Grid */}
            <div className="overflow-hidden rounded-xl border border-[var(--outline-variant)]/30 bg-white shadow-[0_4px_20px_rgba(46,50,48,0.06)] flex flex-col" style={{ maxHeight: "calc(100vh - 280px)" }}>
              {/* Header row */}
              <div className="grid shrink-0 border-b border-[var(--outline-variant)]/30" style={{ gridTemplateColumns: gridCols }}>
                <div className="flex items-center justify-center border-r border-[var(--outline-variant)]/30 p-4">
                  <span className="material-symbols-outlined text-stone-400">schedule</span>
                </div>
                {data.courts.map((court) => (
                  <div key={court.id} className="border-r border-[var(--outline-variant)]/30 p-4 text-center last:border-r-0">
                    <p className="font-bold text-[var(--primary)]">{court.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-stone-400">{court.location}</p>
                  </div>
                ))}
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: "520px" }}>
                <div className="grid" style={{ gridTemplateColumns: gridCols }}>
                  {/* Time labels column */}
                  <div>
                    {HOURS.map((hour, idx) => (
                      <div
                        key={hour}
                        className={`flex items-start justify-end border-r border-b border-[var(--outline-variant)]/30 px-3 pt-2 text-right text-xs font-bold text-stone-400 ${idx % 2 === 0 ? "bg-[var(--surface-container-low)]/30" : ""}`}
                        style={{ height: ROW_H }}
                      >
                        {fmtHour(hour)}
                      </div>
                    ))}
                  </div>

                  {/* Court columns */}
                  {data.courts.map((court) => {
                    const bookings = bookingsByCourt.get(court.id) ?? [];
                    return (
                      <div key={court.id} className="relative border-r border-[var(--outline-variant)]/20 last:border-r-0">
                        {/* Row backgrounds */}
                        {HOURS.map((hour, idx) => (
                          <div
                            key={hour}
                            className={`border-b border-[var(--outline-variant)]/10 ${idx % 2 === 0 ? "bg-[var(--surface-container-low)]/20" : ""}`}
                            style={{ height: ROW_H }}
                          />
                        ))}
                        {/* Booking cards (absolutely positioned) */}
                        {bookings.map((booking) => {
                          const startDate = new Date(booking.startTime);
                          const hourOffset = startDate.getHours() - START_HOUR;
                          const minOffset = startDate.getMinutes();
                          if (hourOffset < 0 || hourOffset >= HOURS.length) return null;
                          const top = hourOffset * ROW_H + (minOffset / 60) * ROW_H + 4;
                          const height = bookingHeightPx(booking.startTime, booking.endTime);
                          return (
                            <div
                              key={booking.id}
                              className="absolute left-1.5 right-1.5 z-10"
                              style={{ top, height }}
                            >
                              <div className={`h-full rounded-lg border-l-4 p-2.5 flex flex-col justify-between cursor-pointer transition-colors hover:brightness-95 ${STATUS_STYLES[booking.status]}`}>
                                <div>
                                  <div className="flex items-start justify-between gap-1">
                                    <p className="font-bold text-xs text-[var(--on-surface)] leading-tight truncate">{booking.playerName}</p>
                                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[booking.status]}`}>
                                      {booking.status}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-stone-500 mt-1">
                                    {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    {" – "}
                                    {new Date(booking.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                                {booking.status === "confirmed" && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--primary)]">
                                    <span>View Details</span>
                                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                  </div>
                                )}
                                {booking.status === "pending" && (
                                  <p className="text-[10px] italic text-[var(--tertiary)]">Awaiting payment</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stats footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--outline-variant)]/20 bg-[var(--surface-container-low)]/50 px-6 py-3 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[var(--primary)]" />
                  <span className="text-xs font-semibold text-stone-600">{data.stats.occupancy}% Occupancy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[var(--tertiary)]" />
                  <span className="text-xs font-semibold text-stone-600">{data.stats.pendingBookings} Pending Actions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[var(--secondary)]" />
                  <span className="text-xs font-semibold text-stone-600">{data.stats.totalBookings} Bookings Today</span>
                </div>
              </div>
              <p className="text-xs italic text-stone-400">
                Last updated: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </ManagerShell>
  );
}

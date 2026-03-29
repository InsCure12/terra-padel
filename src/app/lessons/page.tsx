"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PlayerBottomNav from "@/components/player-bottom-nav";
import PlayerFooter from "@/components/player-footer";
import PlayerNavbar from "@/components/player-navbar";

type Coach = {
  id: string;
  name: string;
  headline: string;
  priceLabel: string;
  rating: number;
  bio: string;
  levels: string[];
  sessionType: "Private Lessons" | "Group Sessions" | "Clinics & Workshops";
  image: string;
};

type LessonsData = {
  stats: {
    activeCourts: number;
    totalPlayers: number;
    monthlyBookings: number;
  };
  coaches: Coach[];
  assessment: {
    title: string;
    description: string;
  };
};

export default function LessonsPage() {
  const [data, setData] = useState<LessonsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All Levels");
  const [sessionType, setSessionType] = useState("Private Lessons");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/lessons", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load lessons");
        const json = (await res.json()) as { data: LessonsData };
        setData(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load lessons");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(() => {
    const rows = data?.coaches ?? [];
    return rows.filter((coach) => {
      const bySearch =
        !search ||
        coach.name.toLowerCase().includes(search.toLowerCase()) ||
        coach.bio.toLowerCase().includes(search.toLowerCase()) ||
        coach.headline.toLowerCase().includes(search.toLowerCase());
      const byLevel = level === "All Levels" || coach.levels.includes(level);
      const byType = !sessionType || coach.sessionType === sessionType;
      return bySearch && byLevel && byType;
    });
  }, [data, search, level, sessionType]);

  return (
    <div className="min-h-screen bg-background text-[var(--on-surface)]">
      <PlayerNavbar activeTab="lessons" />

      <div className="flex min-h-screen pt-16">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 flex-col border-r border-stone-200 bg-[#faf6f0] p-4 md:flex">
          <div className="px-4 py-6">
            <h2 className="text-xl text-[var(--primary)]">Terra Padel</h2>
            <p className="text-xs text-stone-500">Rooted in Community</p>
          </div>
          <Link className="flex items-center gap-3 rounded-xl px-4 py-3 text-stone-600 hover:bg-stone-100" href="/">
            <span className="material-symbols-outlined">home</span>
            Home
          </Link>
          <Link className="flex items-center gap-3 rounded-xl px-4 py-3 text-stone-600 hover:bg-stone-100" href="/memberships">
            <span className="material-symbols-outlined">card_membership</span>
            Memberships
          </Link>
          <Link className="flex items-center gap-3 rounded-xl bg-[var(--primary)]/10 px-4 py-3 font-semibold text-[var(--primary)]" href="/lessons">
            <span className="material-symbols-outlined fill-icon">school</span>
            Lessons
          </Link>
          <Link className="flex items-center gap-3 rounded-xl px-4 py-3 text-stone-600 hover:bg-stone-100" href="/events">
            <span className="material-symbols-outlined">event</span>
            Events
          </Link>

          <div className="mt-auto rounded-2xl border border-[var(--tertiary-container)]/30 bg-[var(--tertiary-container)]/20 p-4">
            <p className="mb-2 text-xs font-bold tracking-wider text-[var(--tertiary)] uppercase">Member Perk</p>
            <p className="text-sm leading-snug text-[var(--on-surface)]">Get 20% off all private coaching sessions this month.</p>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-10">
          <section className="mx-auto mb-12 max-w-6xl">
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="mb-2 text-4xl italic md:text-5xl">Lessons & Coaching</h1>
                <p className="max-w-xl text-lg leading-relaxed text-[var(--on-surface-variant)]">
                  Refine your game with expert guidance. Whether you are picking up a racket for the first time or mastering the bandeja, our certified coaches are here to help.
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white shadow-md">
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                Book a Court
              </button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-[var(--surface-container)] p-4 text-sm font-semibold text-stone-700">{data?.stats.activeCourts ?? 0} active courts</div>
              <div className="rounded-xl bg-[var(--surface-container)] p-4 text-sm font-semibold text-stone-700">{data?.stats.totalPlayers ?? 0} registered players</div>
              <div className="rounded-xl bg-[var(--surface-container)] p-4 text-sm font-semibold text-stone-700">{data?.stats.monthlyBookings ?? 0} bookings this month</div>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--outline-variant)]/30 bg-[var(--surface-container-low)] p-6">
              <div className="min-w-[220px] flex-1">
                <label className="mb-2 ml-1 block text-xs font-bold tracking-widest text-[var(--primary)] uppercase">Search</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search lessons or coach"
                  className="w-full rounded-lg border border-[var(--outline-variant)]/50 bg-white px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold tracking-widest text-[var(--primary)] uppercase">Skill Level</label>
                <div className="flex gap-2">
                  {["All Levels", "Beginner", "Intermediate", "Pro"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setLevel(item)}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                        level === item ? "bg-[var(--primary)] text-white" : "border border-[var(--outline-variant)]/50 bg-white text-stone-600"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold tracking-widest text-[var(--primary)] uppercase">Session Type</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="rounded-lg border border-[var(--outline-variant)]/50 bg-white px-4 py-2 text-sm"
                >
                  <option>Private Lessons</option>
                  <option>Group Sessions</option>
                  <option>Clinics & Workshops</option>
                </select>
              </div>
            </div>
          </section>

          {loading ? <p className="mx-auto max-w-6xl py-10 text-stone-500">Loading lessons...</p> : null}
          {error ? <p className="mx-auto max-w-6xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((coach) => (
              <article key={coach.id} className="group overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_rgba(46,50,48,0.06)] transition-all hover:shadow-[0_8px_30px_rgba(46,50,48,0.12)]">
                <div className="relative h-64 overflow-hidden">
                  <img src={coach.image} alt={coach.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 rounded-full bg-[var(--tertiary-fixed)] px-3 py-1 text-xs font-bold tracking-wider text-[var(--on-tertiary-fixed)] uppercase">
                    {coach.headline}
                  </div>
                  <div className="absolute right-4 bottom-4 rounded-lg bg-white/90 px-3 py-1 backdrop-blur-sm">
                    <span className="font-bold text-[var(--primary)]">{coach.priceLabel}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-xl font-bold">{coach.name}</h3>
                    <div className="flex items-center text-[var(--tertiary)]">
                      <span className="material-symbols-outlined fill-icon text-base">star</span>
                      <span className="ml-1 text-sm font-bold">{coach.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="mb-4 text-sm text-[var(--secondary)]">{coach.bio}</p>
                  <div className="mb-6 flex flex-wrap gap-2">
                    {coach.levels.map((lv) => (
                      <span key={lv} className="rounded bg-[var(--surface-container)] px-2 py-1 text-[10px] font-bold tracking-wide text-[var(--on-surface-variant)] uppercase">
                        {lv}
                      </span>
                    ))}
                  </div>
                  <button className="w-full rounded-xl border-2 border-[var(--primary)] py-3 font-bold text-[var(--primary)] transition-all hover:bg-[var(--primary)] hover:text-white">
                    Book Session
                  </button>
                </div>
              </article>
            ))}

            <article className="rounded-xl border border-[var(--primary-container)]/20 bg-[var(--primary-container)]/30 p-8 lg:col-span-2">
              <h3 className="mb-4 text-3xl text-[var(--on-primary-fixed-variant)]">{data?.assessment.title}</h3>
              <p className="mb-6 text-lg leading-relaxed text-[var(--on-surface-variant)]">{data?.assessment.description}</p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <button className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-8 py-3 font-bold text-white">
                  Book Assessment
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button className="rounded-xl border border-[var(--primary)] bg-white/50 px-8 py-3 font-bold text-[var(--primary)]">
                  Contact Support
                </button>
              </div>
            </article>
          </section>
        </main>
      </div>

      <PlayerFooter />
      <PlayerBottomNav activeTab="lessons" />
    </div>
  );
}

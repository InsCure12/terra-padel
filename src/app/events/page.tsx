"use client";

import { useEffect, useMemo, useState } from "react";
import PlayerBottomNav from "@/components/player-bottom-nav";
import PlayerFooter from "@/components/player-footer";
import PlayerNavbar from "@/components/player-navbar";

type EventItem = {
  id: string;
  title: string;
  month: string;
  day: string;
  time: string;
  level: string;
  fee: string;
  cta: string;
  category: string;
  image: string;
};

type EventsResponse = {
  data: {
    stats: {
      totalCourts: number;
      monthlyBookings: number;
    };
    featuredEvent: {
      id: string;
      type: string;
      title: string;
      description: string;
      dateLabel: string;
      image: string;
    };
    communityHighlights: Array<{ id: string; title: string; subtitle: string }>;
    upcomingEvents: EventItem[];
    hostFeatures: string[];
  };
};

export default function EventsPage() {
  const [data, setData] = useState<EventsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("All Categories");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load events");
        const json = (await res.json()) as EventsResponse;
        setData(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredEvents = useMemo(() => {
    const items = data?.upcomingEvents ?? [];
    if (category === "All Categories") return items;
    if (category === "Tournaments") return items.filter((e) => e.category === "Tournaments");
    if (category === "Socials") return items.filter((e) => e.category === "Socials");
    return items;
  }, [data, category]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PlayerNavbar activeTab="events" />

      <main className="mx-auto w-full max-w-7xl px-6 pt-24 pb-28 md:pb-12">
        <section className="mb-16 text-center md:text-left">
          <span className="mb-2 block text-sm font-bold tracking-widest text-[var(--tertiary)] uppercase">Our Community</span>
          <h1 className="mb-4 text-4xl text-[var(--primary)] md:text-6xl">Gather Around the Court</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-[var(--on-surface-variant)]">
            From competitive tournaments to sunset mixers, Terra Padel is where connections take root. Join us for an upcoming experience.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-[var(--secondary-container)] px-3 py-1 font-semibold text-stone-700">
              {data?.stats.totalCourts ?? 0} courts active
            </span>
            <span className="rounded-full bg-[var(--surface-container)] px-3 py-1 font-semibold text-stone-700">
              {data?.stats.monthlyBookings ?? 0} bookings this month
            </span>
          </div>
        </section>

        {loading ? <p className="py-6 text-stone-500">Loading events...</p> : null}
        {error ? <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {data ? (
          <>
            <section className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="group relative h-[400px] overflow-hidden rounded-xl bg-[var(--surface-container-high)] md:col-span-8">
                <img
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={data.featuredEvent.image}
                  alt={data.featuredEvent.title}
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="rounded-full bg-[var(--tertiary)] px-3 py-1 text-xs font-bold tracking-wider text-white uppercase">
                      {data.featuredEvent.type}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-white/80">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      {data.featuredEvent.dateLabel}
                    </span>
                  </div>
                  <h2 className="mb-2 text-3xl text-white">{data.featuredEvent.title}</h2>
                  <p className="mb-6 max-w-lg text-white/90">{data.featuredEvent.description}</p>
                  <div className="flex gap-4">
                    <button className="rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[var(--primary-container)]">
                      Register Now
                    </button>
                    <button className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20">
                      Details
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-[var(--outline-variant)]/30 bg-[var(--secondary-container)] p-8 md:col-span-4">
                <div>
                  <span className="material-symbols-outlined mb-6 text-4xl text-[var(--primary)]">auto_awesome</span>
                  <h3 className="mb-4 text-2xl text-[var(--foreground)]">Community Highlights</h3>
                  <ul className="space-y-6">
                    {data.communityHighlights.map((highlight, idx) => (
                      <li key={highlight.id} className="flex gap-4">
                        <span className="font-bold text-[var(--primary)]">{String(idx + 1).padStart(2, "0")}</span>
                        <div>
                          <p className="font-bold text-[var(--foreground)]">{highlight.title}</p>
                          <p className="text-sm text-[var(--on-surface-variant)]">{highlight.subtitle}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <button className="mt-8 flex items-center gap-2 font-bold text-[var(--primary)] transition-transform hover:translate-x-1">
                  View Full Gallery <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </section>

            <section className="mb-24">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <h2 className="mb-2 text-3xl text-[var(--primary)]">Upcoming Events</h2>
                  <p className="text-[var(--on-surface-variant)]">Find your next challenge or social circle.</p>
                </div>
                <div className="hidden gap-2 md:flex">
                  {[
                    "All Categories",
                    "Tournaments",
                    "Socials",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => setCategory(item)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        category === item
                          ? "border border-[var(--outline-variant)]/50 bg-[var(--surface-container)] text-[var(--foreground)]"
                          : "text-stone-500"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((eventItem) => (
                  <article key={eventItem.id} className="flex flex-col overflow-hidden rounded-xl bg-[var(--surface-container-low)] shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
                    <div className="relative h-48">
                      <img className="h-full w-full object-cover" src={eventItem.image} alt={eventItem.title} />
                      <div className="absolute top-4 left-4 rounded-lg bg-[#faf6f0] px-3 py-1 text-center shadow-sm">
                        <span className="block text-xs font-bold text-[var(--tertiary)] uppercase">{eventItem.month}</span>
                        <span className="block text-lg leading-none font-bold text-[var(--primary)]">{eventItem.day}</span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-[var(--foreground)]">{eventItem.title}</h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-[var(--on-surface-variant)]">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          {eventItem.time}
                        </p>
                      </div>
                      <div className="mb-6 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--on-surface-variant)]">Skill Level</span>
                          <span className="font-bold text-[var(--foreground)]">{eventItem.level}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--on-surface-variant)]">Entry Fee</span>
                          <span className="font-bold text-[var(--primary)]">{eventItem.fee}</span>
                        </div>
                      </div>
                      <button className="mt-auto w-full rounded-xl bg-[var(--primary)] py-3 font-bold text-white transition-all active:scale-95">
                        {eventItem.cta}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="flex flex-col items-center gap-12 rounded-3xl border border-[var(--outline-variant)]/30 bg-[var(--surface-container)] p-8 md:flex-row md:p-16">
              <div className="order-2 md:order-1 md:w-1/2">
                <span className="mb-4 block text-sm font-bold tracking-widest text-[var(--primary)] uppercase">Grow with us</span>
                <h2 className="mb-6 text-3xl text-[var(--foreground)] md:text-5xl">Host Your Own Event</h2>
                <p className="mb-8 text-lg leading-relaxed text-[var(--on-surface-variant)]">
                  Have an idea for a birthday tournament, a corporate team-building day, or a private clinic? We provide the courts, gear, and atmosphere.
                </p>
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.hostFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <span className="material-symbols-outlined fill-icon text-[var(--primary)]">check_circle</span>
                      <span className="font-medium text-[var(--foreground)]">{feature}</span>
                    </div>
                  ))}
                </div>
                <button className="rounded-xl bg-[var(--tertiary)] px-8 py-4 font-bold text-white shadow-md transition-opacity hover:opacity-90">
                  Request a Proposal
                </button>
              </div>
              <div className="order-1 md:order-2 md:w-1/2">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-[var(--tertiary)]/10 blur-3xl" />
                  <img
                    className="relative aspect-square w-full rounded-2xl border-4 border-white/50 object-cover shadow-xl"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnnta6PRhEZzeEWngx6xFotHl3RRMqHYusl-fTq2H6QEng1u_Xj_GYETIMTOrsuYe1jylACjVbUMcYsEwUeKK-IaFVRbhsUgYw1K4FL2SWoUST52f28e92Li0vId7HbfI2NnXtNidMHt-VYXvp3FEMtGqbg8VANpXfebKD16eF5lAmAgTqj182YVqzBcoD00i06GVEYh1tkEs_1jfrCOuuOjbQU2vU3JVPtnpPkFSCDtwiI8zOfct2CsiuvJG7l6Dqv1C7HqkIh3w"
                    alt="Host your event"
                  />
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <PlayerFooter />
      <PlayerBottomNav activeTab="events" />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import PlayerBottomNav from "@/components/player-bottom-nav";
import PlayerFooter from "@/components/player-footer";
import PlayerNavbar from "@/components/player-navbar";

type Plan = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  price: number;
  accent: "primary" | "tertiary";
  cta: string;
  featured: boolean;
  benefits: string[];
};

type MembershipData = {
  stats: {
    totalMembers: number;
  };
  plans: Plan[];
  comparisonRows: Array<{ feature: string; seed: string; sprout: string; oak: string }>;
  gallery: {
    main: string;
    gym: string;
    yoga: string;
    lounge: string;
  };
};

export default function MembershipsPage() {
  const [data, setData] = useState<MembershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/memberships", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load memberships");
        const json = (await res.json()) as { data: MembershipData };
        setData(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load memberships");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-background text-[var(--on-surface)]">
      <PlayerNavbar activeTab="memberships" />

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-32">
        <section className="mb-16 text-center">
          <h1 className="mb-4 text-4xl italic text-[var(--primary)] md:text-5xl">Cultivate Your Game</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--on-surface-variant)]">
            Choose a plan that fits your growth. From casual players to court veterans, our memberships are designed to keep you rooted in the community.
          </p>
          <p className="mt-4 inline-block rounded-full bg-[var(--surface-container)] px-4 py-2 text-sm font-semibold text-stone-700">
            {data?.stats.totalMembers ?? 0} active members
          </p>
        </section>

        {loading ? <p className="py-8 text-stone-500">Loading memberships...</p> : null}
        {error ? <p className="mb-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {data ? (
          <>
            <section className="mb-24 grid grid-cols-1 gap-8 md:grid-cols-3">
              {data.plans.map((plan) => {
                const isTertiary = plan.accent === "tertiary";
                return (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col rounded-xl border p-8 shadow-[0_4px_20px_rgba(46,50,48,0.06)] ${
                      plan.featured
                        ? "border-2 border-[var(--primary)] bg-[var(--primary-container)]/20 md:-translate-y-4"
                        : isTertiary
                          ? "border-[var(--outline-variant)]/30 bg-[var(--surface-container-high)]"
                          : "border-[var(--outline-variant)]/30 bg-[var(--surface-container-low)]"
                    }`}
                  >
                    {plan.featured ? (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-4 py-1 text-xs font-bold tracking-widest text-white uppercase">
                        Most Popular
                      </div>
                    ) : null}
                    <div className="mb-6">
                      <span className={`material-symbols-outlined mb-2 text-4xl ${isTertiary ? "text-[var(--tertiary)]" : "text-[var(--primary)]"}`}>{plan.icon}</span>
                      <h2 className="text-2xl italic">{plan.name}</h2>
                      <p className="text-sm text-[var(--on-surface-variant)]">{plan.subtitle}</p>
                    </div>
                    <div className="mb-8">
                      <span className={`text-4xl font-bold ${isTertiary ? "text-[var(--tertiary)]" : "text-[var(--primary)]"}`}>${plan.price}</span>
                      <span className="text-[var(--on-surface-variant)]">/month</span>
                    </div>
                    <ul className="mb-12 flex-grow space-y-4">
                      {plan.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-3">
                          <span className={`material-symbols-outlined text-xl ${isTertiary ? "text-[var(--tertiary)]" : "text-[var(--primary)]"}`}>check_circle</span>
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`w-full rounded-lg py-3 font-bold transition-all ${
                        plan.featured
                          ? "bg-[var(--primary)] text-white hover:opacity-90"
                          : isTertiary
                            ? "bg-[var(--tertiary)] text-white hover:opacity-90"
                            : "border border-[var(--primary)] bg-white text-[var(--primary)] hover:bg-[var(--primary)]/5"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </article>
                );
              })}
            </section>

            <section className="mt-24">
              <h2 className="mb-8 text-center text-3xl italic">Compare Benefits</h2>
              <div className="overflow-x-auto rounded-xl border border-[var(--outline-variant)]/20 bg-white shadow-sm">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--outline-variant)]/30 bg-[var(--surface-container)]">
                      <th className="p-6 text-lg italic text-[var(--on-surface-variant)]">Features</th>
                      <th className="p-6 text-center font-bold text-[var(--primary)]">Seed</th>
                      <th className="p-6 text-center font-bold text-[var(--primary)]">Sprout</th>
                      <th className="p-6 text-center font-bold text-[var(--tertiary)]">Ancient Oak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--outline-variant)]/20">
                    {data.comparisonRows.map((row) => (
                      <tr key={row.feature}>
                        <td className="p-6 font-medium">{row.feature}</td>
                        <td className="p-6 text-center text-[var(--on-surface-variant)]">{row.seed}</td>
                        <td className="p-6 text-center text-[var(--on-surface-variant)]">{row.sprout}</td>
                        <td className="p-6 text-center font-bold text-[var(--on-surface)]">{row.oak}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-24 grid h-[500px] grid-cols-1 grid-rows-2 gap-4 md:grid-cols-4">
              <div className="relative overflow-hidden rounded-xl md:col-span-2 md:row-span-2 group">
                <img src={data.gallery.main} alt="Padel Court" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-2xl italic">Rooted in Nature</p>
                  <p className="text-sm opacity-90">Our courts are built to blend seamlessly with the environment.</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl md:col-span-2">
                <img src={data.gallery.gym} alt="Gym" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center text-xl italic text-white">Premium Facilities</div>
              </div>
              <div className="overflow-hidden rounded-xl">
                <img src={data.gallery.yoga} alt="Yoga" className="h-full w-full object-cover" />
              </div>
              <div className="overflow-hidden rounded-xl">
                <img src={data.gallery.lounge} alt="Lounge" className="h-full w-full object-cover" />
              </div>
            </section>
          </>
        ) : null}
      </main>

      <PlayerFooter />
      <PlayerBottomNav activeTab="memberships" />
    </div>
  );
}

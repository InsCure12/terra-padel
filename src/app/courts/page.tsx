"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PlayerBottomNav from "@/components/player-bottom-nav";
import PlayerFooter from "@/components/player-footer";
import PlayerNavbar from "@/components/player-navbar";

type Court = {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  averageRating: number;
  totalReviews: number;
};

const CARD_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAFrkKZI0dP9zXv153f8P9HLN5eU-7CJUfp_t-j8K-UThqHZ-15f-2fdSEgrjdJNllwmUvMZlDngXSlsET05C3gDyMfVgLku7y7ErDVE9wcaNnXmU-cy8AxF6ZUFM-_WGFgE1FNd0fYFh2BvyrBDb65RWsQrTngJ-eBqLGB-_QJR10f1mTTX0fzfFvtwZ5OOP_M7EPrbeC14azYsP0YxQCAQBzvSR4IMR_wWfrYqVLah60YaThYglO3Pkz4zEak2rG38epsCUkV5S0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBxDntxoNFteXkzq3SBvpzCvF_uYdEg1_uC6gt2lv9To02C6ewViBQESwuGpZPfxK-V-SZ41YqM4OJfIZf17s9K4aQjuPXPCF6yQisF3DU5dU94MNxe3B3Iqi8jUWN0YkzCYY13e19QI2xRWcBQksPCkkHwcqMINfe3kghaIqlecMcVKtCRKsPCwLmfQQ8TVuHWTyCFdP0-5_hhYwi7uOGHjmfRvRx03sq-K8BWKvi2FBP5HNxN108yIkyTw9m3wGwm8X1fmc8UT0M",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCFwBnXws4_bFmxGE2eQWVcfERO_kyvQ0JDoaHxo5xR79qXnSH7C8xQols5UJrC3au0Pkni0CxB1iJLuHBxORUNOvbPcSG5zpSmmsYVz-D7pNGsPQF64IsZ0qpku5WTietwGspSPfwS9eGSIBz7uit5OAFhvfkn-ZrbLWbIQ9c3mtw6idCHddj3Zobuk8hQe7AdCnwVhW7ArhRoI2edzllT096A0dCAHWK_6Yl4SiQwWEci8jhLx4DYKMNzmU2KjIXNkvCmVIAeaA8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDPNo1Ub6IDfSnuQGxiJUN-azY6D6Oxcv-JWHbxFGReHAgKH7S30KD8Ny5MZKz59bNI_JRAmOiuAsM9Q6BeyKbzHYA0EVcxuqhAPfKGQ8n0AJOUQWE3I-h4upmLB7fFNsBFBZLp2dyVZp3vG8zGvB3ZVlJY0R4isTznzb5thyitbQjuK7F0VoX87qSUsa1PUijk0r4_JwbvBSXwZeLsngQrDuNvSVcjJ9k2rwjdrs1bn_kpJtydnvlfInywJNpvo_qf9UYChz9H9iI",
];

function classifyTag(location: string) {
  const lc = location.toLowerCase();
  if (lc.includes("indoor")) return "Indoor";
  if (lc.includes("outdoor")) return "Outdoor";
  if (lc.includes("premium")) return "Elite";
  return "Doubles";
}

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [priceRange, setPriceRange] = useState("All prices");
  const [tagFilter, setTagFilter] = useState<string>("All");

  const loadCourts = async (loc = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courts${loc ? `?location=${encodeURIComponent(loc)}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load courts");
      const json = (await res.json()) as { data: Court[] };
      setCourts(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load courts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourts();
  }, []);

  const filteredCourts = useMemo(() => {
    return courts.filter((court) => {
      const matchesTag = tagFilter === "All" || classifyTag(court.location) === tagFilter;
      let matchesPrice = true;
      if (priceRange === "$15 - $25") {
        matchesPrice = court.pricePerHour >= 150000 && court.pricePerHour <= 250000;
      }
      if (priceRange === "$25 - $40") {
        matchesPrice = court.pricePerHour > 250000 && court.pricePerHour <= 400000;
      }
      if (priceRange === "$40+") {
        matchesPrice = court.pricePerHour > 400000;
      }
      return matchesTag && matchesPrice;
    });
  }, [courts, tagFilter, priceRange]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PlayerNavbar activeTab="courts" showBookNow />

      <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8">
        <section className="mb-10 rounded-xl border border-[var(--outline-variant)]/30 bg-[var(--surface-container-low)] p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--on-surface-variant)]">Location</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">location_on</span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search city..."
                  className="w-full rounded-lg bg-white py-3 pr-4 pl-10 text-sm ring-1 ring-[var(--outline-variant)]/50 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--on-surface-variant)]">Price Range</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">payments</span>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full rounded-lg bg-white py-3 pr-4 pl-10 text-sm ring-1 ring-[var(--outline-variant)]/50 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option>All prices</option>
                  <option>$15 - $25</option>
                  <option>$25 - $40</option>
                  <option>$40+</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--on-surface-variant)]">Type</label>
              <div className="flex flex-wrap gap-2">
                {["All", "Indoor", "Outdoor", "Elite"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tag)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                      tagFilter === tag
                        ? "bg-[var(--secondary-container)] text-[var(--foreground)]"
                        : "bg-white text-stone-500 hover:bg-[var(--surface)]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end lg:col-span-2">
              <button
                onClick={() => void loadCourts(location)}
                className="w-full rounded-lg bg-[var(--primary)] py-3 font-bold text-white shadow-md transition-opacity hover:opacity-95"
              >
                Find Courts
              </button>
            </div>
          </div>
        </section>

        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Available Courts <span className="ml-2 text-lg font-normal text-stone-500">({filteredCourts.length} matches)</span>
          </h2>
          <span className="text-sm text-stone-500">Sorted by rating and freshness</span>
        </div>

        {loading ? <p className="py-8 text-stone-500">Loading courts...</p> : null}
        {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCourts.map((court, index) => {
            const img = CARD_IMAGES[index % CARD_IMAGES.length];
            const tag = classifyTag(court.location);
            const usdHour = Math.max(10, Math.round(court.pricePerHour / 10000));

            return (
              <article
                key={court.id}
                className="group overflow-hidden rounded-xl border border-[var(--outline-variant)]/20 bg-white shadow-[0_4px_20px_rgba(46,50,48,0.06)] transition-all duration-300 hover:shadow-xl"
              >
                <Link href={`/courts/${court.id}`} className="block relative h-56 overflow-hidden">
                  <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={img} alt={court.name} />
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-bold text-[var(--primary)] shadow-sm backdrop-blur-sm">
                    <span className="material-symbols-outlined fill-icon text-[14px]">star</span>
                    {court.averageRating.toFixed(1)}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="rounded bg-[var(--tertiary-container)]/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--on-tertiary-container)] backdrop-blur-sm">
                      {tag}
                    </span>
                  </div>
                </Link>
                <div className="p-5">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <Link href={`/courts/${court.id}`} className="text-lg leading-tight font-bold text-[var(--foreground)] hover:text-[var(--primary)]">
                      {court.name}
                    </Link>
                    <span className="font-bold text-[var(--primary)]">
                      ${usdHour} <span className="text-xs font-normal text-stone-500">/ hr</span>
                    </span>
                  </div>
                  <p className="mb-4 flex items-center gap-1 text-sm text-[var(--on-surface-variant)]">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {court.location}
                  </p>
                  <p className="mb-4 text-xs text-stone-500">{court.totalReviews} review(s)</p>
                  <div className="flex items-center gap-3 border-t border-[var(--outline-variant)]/20 pt-4">
                    <Link
                      href={`/courts/${court.id}`}
                      className="flex-1 rounded-lg bg-[var(--primary)] py-2.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Book Now
                    </Link>
                    <button className="rounded-lg border border-[var(--outline-variant)]/50 p-2.5 text-stone-500 transition-colors hover:bg-[var(--surface-container)]">
                      <span className="material-symbols-outlined">favorite</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>
      <PlayerFooter />
      <PlayerBottomNav activeTab="courts" />
    </div>
  );
}

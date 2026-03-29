"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import LoginForm from "@/components/auth/login-form";
import PlayerBottomNav from "@/components/player-bottom-nav";
import PlayerFooter from "@/components/player-footer";
import PlayerNavbar from "@/components/player-navbar";

type CourtDetailsResponse = {
  data: {
    court: {
      id: string;
      name: string;
      location: string;
      pricePerHour: number;
      averageRating: number;
      totalReviews: number;
    };
    amenities: Array<{ title: string; subtitle: string; icon: string }>;
    galleryImages: string[];
    bookings: Array<{
      id: string;
      startTime: string;
      endTime: string;
      status: "pending" | "confirmed";
    }>;
    reviews: Array<{
      id: string;
      rating: number;
      comment: string;
      createdAt: string;
      playerName: string;
    }>;
  };
};

type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: "player" | "manager";
};

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toClockLabel(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function localDateTime(dateStr: string, hour: number, minute: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function CourtDetailBookingPage() {
  const params = useParams<{ courtId: string }>();
  const courtId = params.courtId;

  const [data, setData] = useState<CourtDetailsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(formatDateInput(new Date()));
  const [duration, setDuration] = useState<60 | 90>(60);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [resumeBookingAfterLogin, setResumeBookingAfterLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const todayIso = useMemo(() => formatDateInput(new Date()), []);

  const dateOptions = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    return Array.from({ length: 14 }, (_, idx) => {
      const value = addDays(base, idx);
      return {
        value: formatDateInput(value),
        dayLabel: value.toLocaleDateString([], { weekday: "short" }),
        dateLabel: value.toLocaleDateString([], { day: "2-digit", month: "short" }),
      };
    });
  }, []);

  const loadDetails = async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courts/${courtId}?date=${encodeURIComponent(d)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load court details");
      const json = (await res.json()) as CourtDetailsResponse;
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load court details");
    } finally {
      setLoading(false);
    }
  };

  const loadMe = async () => {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) {
      setUser(null);
      return;
    }
    const json = (await res.json()) as { data: CurrentUser };
    setUser(json.data);
  };

  useEffect(() => {
    void loadDetails(date);
    void loadMe();
  }, [courtId, date]);

  const slots = useMemo(() => {
    const out: Array<{ key: string; label: string; start: Date; end: Date; available: boolean }> = [];
    const dayBookings = data?.bookings ?? [];

    for (let hour = 8; hour <= 20; hour += 1) {
      const minute = hour % 2 === 0 ? 0 : 30;
      const start = localDateTime(date, hour, minute);
      const end = new Date(start.getTime() + duration * 60_000);

      const overlap = dayBookings.some((b) => {
        const bs = new Date(b.startTime).getTime();
        const be = new Date(b.endTime).getTime();
        return start.getTime() < be && end.getTime() > bs;
      });

      const key = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
      out.push({ key, label: toClockLabel(start.getHours(), start.getMinutes()), start, end, available: !overlap });
    }

    return out;
  }, [data, date, duration]);

  const selected = useMemo(() => slots.find((s) => s.key === selectedSlot) ?? null, [slots, selectedSlot]);

  const basePrice = useMemo(() => {
    if (!data) return 0;
    return Math.round((data.court.pricePerHour / 10000) * (duration / 60));
  }, [data, duration]);

  const serviceFee = useMemo(() => Math.max(2, Number((basePrice * 0.1).toFixed(2))), [basePrice]);
  const totalPrice = Number((basePrice + serviceFee).toFixed(2));

  const createBooking = async () => {
    if (!selected) {
      setBookError("Please select a time slot first.");
      return false;
    }

    setSubmitting(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courtId,
        startTime: selected.start.toISOString(),
        endTime: selected.end.toISOString(),
        paymentMethod: "bank_transfer",
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      setBookError(json?.error ?? "Booking failed");
      return false;
    }

    const json = (await res.json()) as { data: { booking: { id: string } } };
    router.push(`/payment/${json.data.booking.id}`);
    return true;
  };

  useEffect(() => {
    if (!resumeBookingAfterLogin || !user || !selected) {
      return;
    }

    setResumeBookingAfterLogin(false);
    void createBooking();
  }, [resumeBookingAfterLogin, user, selected]);

  const onContinue = async (event: FormEvent) => {
    event.preventDefault();
    setBookError(null);

    if (!selected) {
      setBookError("Please select a time slot first.");
      return;
    }

    if (!user) {
      setResumeBookingAfterLogin(true);
      setShowAuth(true);
      return;
    }

    await createBooking();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PlayerNavbar activeTab="courts" showBookNow />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--on-surface-variant)]">
          <Link className="hover:text-[var(--primary)]" href="/">Home</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link className="hover:text-[var(--primary)]" href="/courts">Courts</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="font-semibold text-[var(--foreground)]">{data?.court.name ?? "Court"}</span>
        </nav>

        {loading ? <p className="py-8 text-stone-500">Loading court details...</p> : null}
        {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {data ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="mb-10 grid h-[500px] grid-cols-4 grid-rows-2 gap-4">
                <div className="group relative col-span-3 row-span-2 overflow-hidden rounded-xl">
                  <img src={data.galleryImages[0]} alt={data.court.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold tracking-wider text-[var(--primary)] uppercase shadow-sm">Top Rated</div>
                </div>
                <div className="overflow-hidden rounded-xl">
                  <img src={data.galleryImages[1]} alt="Court details" className="h-full w-full object-cover" />
                </div>
                <div className="group relative overflow-hidden rounded-xl">
                  <img src={data.galleryImages[2]} alt="Amenities" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="font-semibold text-white">+ photos</span>
                  </div>
                </div>
              </div>

              <div className="mb-12">
                <div className="mb-2 flex items-center gap-4">
                  <span className="flex items-center gap-1 font-semibold text-[var(--tertiary)]">
                    <span className="material-symbols-outlined fill-icon text-sm">star</span>
                    {data.court.averageRating.toFixed(1)} ({data.court.totalReviews} reviews)
                  </span>
                  <span className="text-[var(--outline-variant)]">•</span>
                  <span className="flex items-center gap-1 text-[var(--on-surface-variant)]">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {data.court.location}
                  </span>
                </div>

                <h1 className="mb-4 text-4xl font-bold">{data.court.name}</h1>
                <p className="mb-8 max-w-3xl text-lg leading-relaxed text-[var(--on-surface-variant)]">
                  Experience world-class padel in an environment designed for both performance and serenity. This court features premium turf and thoughtfully curated amenities for every player.
                </p>

                <div className="mb-12 grid grid-cols-2 gap-6 md:grid-cols-3">
                  <div className="rounded-xl border border-[var(--outline-variant)]/30 bg-[var(--surface-container-low)] p-5">
                    <span className="material-symbols-outlined mb-2 text-3xl text-[var(--primary)]">home_work</span>
                    <h4 className="font-bold">Court Type</h4>
                    <p className="text-sm text-[var(--on-surface-variant)]">Indoor / Climate-Controlled</p>
                  </div>
                  <div className="rounded-xl border border-[var(--outline-variant)]/30 bg-[var(--surface-container-low)] p-5">
                    <span className="material-symbols-outlined mb-2 text-3xl text-[var(--primary)]">grass</span>
                    <h4 className="font-bold">Surface</h4>
                    <p className="text-sm text-[var(--on-surface-variant)]">Artificial Turf</p>
                  </div>
                  <div className="rounded-xl border border-[var(--outline-variant)]/30 bg-[var(--surface-container-low)] p-5">
                    <span className="material-symbols-outlined mb-2 text-3xl text-[var(--primary)]">groups</span>
                    <h4 className="font-bold">Capacity</h4>
                    <p className="text-sm text-[var(--on-surface-variant)]">Up to 4 players</p>
                  </div>
                </div>

                <h3 className="mb-6 text-2xl font-bold">Club Amenities</h3>
                <div className="mb-12 grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
                  {data.amenities.map((amenity) => (
                    <div key={amenity.title} className="group flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--secondary-container)] transition-colors group-hover:bg-[var(--primary)]/10">
                        <span className="material-symbols-outlined text-[var(--primary)]">{amenity.icon}</span>
                      </div>
                      <div>
                        <h5 className="font-bold">{amenity.title}</h5>
                        <p className="text-sm text-[var(--on-surface-variant)]">{amenity.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--outline-variant)]/30 pt-12">
                  <div className="mb-8 flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Community Feedback</h3>
                    <span className="font-bold text-[var(--primary)]">{data.reviews.length} recent reviews</span>
                  </div>
                  <div className="space-y-6">
                    {data.reviews.map((review) => (
                      <article key={review.id} className="rounded-xl border border-[var(--outline-variant)]/20 bg-[var(--surface-container-highest)]/30 p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tertiary-container)] font-bold text-[var(--on-tertiary-container)]">
                            {initials(review.playerName)}
                          </div>
                          <div>
                            <div className="font-bold">{review.playerName}</div>
                            <div className="flex text-[var(--tertiary)]">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} className={`material-symbols-outlined text-xs ${i < review.rating ? "fill-icon" : ""}`}>star</span>
                              ))}
                            </div>
                          </div>
                          <span className="ml-auto text-xs text-[var(--on-surface-variant)]">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="italic text-[var(--on-surface-variant)]">"{review.comment}"</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <form onSubmit={onContinue} className="sticky top-24 rounded-xl border border-[var(--outline-variant)]/20 bg-[var(--surface-container)] p-6 shadow-lg">
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-3xl font-bold">${Math.max(10, Math.round(data.court.pricePerHour / 10000))}</span>
                  <span className="text-[var(--on-surface-variant)]">/ hour</span>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-bold tracking-tight text-[var(--on-surface-variant)] uppercase">Select Date</label>
                  <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {dateOptions.map((option) => {
                      const active = date === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setDate(option.value);
                            setSelectedSlot(null);
                          }}
                          className={active
                            ? "rounded-lg border border-[var(--primary)] bg-[var(--primary)]/10 px-3 py-2 text-left"
                            : "rounded-lg border border-[var(--outline-variant)]/40 bg-white px-3 py-2 text-left hover:bg-[var(--surface-container-low)]"
                          }
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{option.dayLabel}</p>
                          <p className={active ? "text-sm font-bold text-[var(--primary)]" : "text-sm font-bold text-[var(--foreground)]"}>{option.dateLabel}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      min={todayIso}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="w-full rounded-lg border border-[var(--outline-variant)]/30 bg-white px-4 py-3"
                    />
                    <span className="material-symbols-outlined absolute top-3 right-3 text-[var(--on-surface-variant)]">calendar_today</span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-bold tracking-tight text-[var(--on-surface-variant)] uppercase">Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[60, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDuration(d as 60 | 90);
                          setSelectedSlot(null);
                        }}
                        className={duration === d
                          ? "rounded-lg bg-[var(--primary)] py-2 font-semibold text-white shadow-sm"
                          : "rounded-lg border border-[var(--outline-variant)]/50 bg-white py-2 font-semibold text-[var(--foreground)]"
                        }
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="mb-3 block text-sm font-bold tracking-tight text-[var(--on-surface-variant)] uppercase">Available Times</label>
                  <div className="grid h-48 grid-cols-3 gap-2 overflow-y-auto pr-1">
                    {slots.map((slot) => (
                      <button
                        key={slot.key}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.key)}
                        className={
                          !slot.available
                            ? "cursor-not-allowed rounded-md border border-[var(--outline-variant)]/30 bg-[var(--surface-dim)] py-2 text-sm opacity-40"
                            : selectedSlot === slot.key
                              ? "rounded-md border border-[var(--primary)] bg-[var(--primary)]/10 py-2 text-sm font-bold text-[var(--primary)]"
                              : "rounded-md border border-[var(--outline-variant)]/30 py-2 text-sm transition-colors hover:bg-[var(--primary-container)]/20"
                        }
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 space-y-2 border-t border-[var(--outline-variant)]/20 pt-5">
                  <div className="flex justify-between text-[var(--on-surface-variant)]">
                    <span>Court Rental ({duration} min)</span>
                    <span>${basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--on-surface-variant)]">
                    <span>Booking Fee</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-xl font-bold">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {bookError ? <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{bookError}</p> : null}

                <button
                  type="submit"
                  disabled={submitting || !selected}
                  className="w-full rounded-xl bg-[var(--primary)] py-4 text-lg font-bold text-white transition-all hover:opacity-95 active:scale-95 disabled:opacity-60"
                >
                  {submitting ? "Processing..." : "Continue to Payment"}
                </button>
                <p className="mt-4 px-4 text-center text-xs leading-tight text-[var(--on-surface-variant)]">
                  You will not be charged yet. Free cancellation up to 24 hours before your slot.
                </p>
              </form>
            </div>
          </div>
        ) : null}
      </main>

      <PlayerFooter />
      <PlayerBottomNav activeTab="courts" />

      {showAuth ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl md:p-12">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-[var(--surface-container-low)]"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <LoginForm
              redirectOnSuccess={false}
              onSuccess={() => {
                setShowAuth(false);
                void loadMe();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

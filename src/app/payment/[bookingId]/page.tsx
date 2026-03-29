"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PlayerBottomNav from "@/components/player-bottom-nav";
import PlayerFooter from "@/components/player-footer";
import PlayerNavbar from "@/components/player-navbar";

type BookingItem = {
  id: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "cancelled";
  commissionFee: number;
  createdAt: string;
  court: { id: string; name: string; location: string; pricePerHour: number };
  player: { id: string; name: string; email: string };
};

function formatDateLong(date: Date) {
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function formatTimeRange(start: Date, end: Date) {
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function durationMinutes(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function calcCourtRental(pricePerHour: number, start: Date, end: Date) {
  const hours = (end.getTime() - start.getTime()) / 3_600_000;
  return Math.round(pricePerHour * hours);
}

function toDollars(raw: number) {
  return (raw / 10000).toFixed(2);
}

const METHODS = [
  { value: "bank_transfer" as const, label: "Bank Transfer", icon: "account_balance", sublabel: "Transfer direct from your bank" },
  { value: "e_wallet" as const, label: "E-Wallet (GoPay, OVO)", icon: "account_balance_wallet", sublabel: "Pay with your digital wallet" },
];

export default function PaymentPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [method, setMethod] = useState<"bank_transfer" | "e_wallet">("bank_transfer");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (!res.ok) {
        setFetchError("Could not load booking details.");
        setLoading(false);
        return;
      }
      const json = (await res.json()) as { data: BookingItem[] };
      const found = json.data.find((b) => b.id === params.bookingId) ?? null;
      setBooking(found);
      setFetchError(found ? null : "Booking not found or you do not have access.");
      setLoading(false);
    };
    void load();
  }, [params.bookingId]);

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    setPayError(null);

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id, method }),
    });

    setPaying(false);

    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      setPayError(typeof json?.error === "string" ? json.error : "Payment failed. Please try again.");
      return;
    }

    setConfirmed(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--on-surface-variant)]">Loading booking details…</p>
      </div>
    );
  }

  if (fetchError || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] px-6">
        <span className="material-symbols-outlined text-5xl text-red-400">error_outline</span>
        <p className="text-center text-[var(--on-surface-variant)]">{fetchError ?? "Booking not found."}</p>
        <Link href="/profile" className="rounded-lg bg-[var(--primary)] px-5 py-2.5 font-semibold text-white hover:opacity-90">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const courtRental = calcCourtRental(booking.court.pricePerHour, start, end);
  const bookingFee = booking.commissionFee;
  const total = courtRental + bookingFee;

  // ── Confirmation screen ───────────────────────────────────────
  if (confirmed) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <PlayerNavbar />
        <main className="mx-auto flex w-full max-w-lg flex-grow flex-col items-center justify-center px-6 py-24 text-center">
          <div className="w-full rounded-2xl bg-white p-10 shadow-[0_8px_40px_rgba(46,50,48,0.1)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <span className="material-symbols-outlined text-5xl text-[var(--primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h1 className="font-['Literata'] text-3xl font-bold text-[var(--on-surface)]">Booking Confirmed!</h1>
            <p className="mt-3 text-[var(--on-surface-variant)]">
              Your payment has been submitted for{" "}
              <span className="font-semibold text-[var(--on-surface)]">{booking.court.name}</span>.
            </p>

            <div className="mt-8 space-y-3 rounded-xl bg-[var(--surface-container-low)] p-5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--on-surface-variant)]">Location</span>
                <span className="font-semibold text-[var(--on-surface)]">{booking.court.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--on-surface-variant)]">Date</span>
                <span className="font-semibold text-[var(--on-surface)]">{formatDateLong(start)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--on-surface-variant)]">Time</span>
                <span className="font-semibold text-[var(--on-surface)]">{formatTimeRange(start, end)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--outline-variant)]/30 pt-3">
                <span className="text-sm font-semibold text-[var(--on-surface-variant)]">Total Paid</span>
                <span className="font-bold text-[var(--primary)]">${toDollars(total)}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/profile"
                className="w-full rounded-xl bg-[var(--primary)] py-3.5 font-bold text-white transition-all hover:opacity-90"
              >
                View My Bookings
              </Link>
              <Link
                href="/courts"
                className="w-full rounded-xl border border-[var(--outline-variant)] py-3.5 font-semibold text-[var(--on-surface)] transition-colors hover:bg-[var(--surface-container-low)]"
              >
                Book Another Court
              </Link>
            </div>
          </div>
        </main>
        <PlayerFooter />
        <PlayerBottomNav activeTab="courts" />
      </div>
    );
  }

  // ── Payment form ──────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] pb-24 md:pb-0">
      <PlayerNavbar />

      <main className="mx-auto w-full max-w-6xl flex-grow px-4 pt-24 pb-20 md:px-8">
        {/* Progress Steps */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-container-highest)] text-sm font-bold text-[var(--on-surface-variant)]">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </span>
            <span className="text-sm font-medium text-[var(--on-surface-variant)]">Booking</span>
          </div>
          <div className="h-px w-12 bg-[var(--outline-variant)]" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white">2</span>
            <span className="text-sm font-medium text-[var(--primary)]">Payment</span>
          </div>
          <div className="h-px w-12 bg-[var(--outline-variant)]" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-container-highest)] text-sm font-bold text-[var(--on-surface-variant)]">3</span>
            <span className="text-sm font-medium text-[var(--on-surface-variant)]">Confirm</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ── Left: Payment Methods ─────────────────────────── */}
          <div className="space-y-6 lg:col-span-7">
            <section className="rounded-xl bg-[var(--surface-container-low)] p-8 shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
              <h2 className="font-['Literata'] mb-6 text-2xl font-bold text-[var(--on-surface)]">Payment Method</h2>
              <div className="space-y-4">
                {METHODS.map((m) => {
                  const active = method === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className={`w-full rounded-lg p-5 text-left transition-colors ${
                        active
                          ? "border-2 border-[var(--primary)] bg-[var(--surface-container)]"
                          : "border border-[var(--outline-variant)] hover:bg-[var(--surface-container)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              active ? "border-[var(--primary)]" : "border-[var(--outline-variant)]"
                            }`}
                          >
                            {active && <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />}
                          </span>
                          <div>
                            <p className="font-semibold text-[var(--on-surface)]">{m.label}</p>
                            <p className="text-xs text-[var(--on-surface-variant)]">{m.sublabel}</p>
                          </div>
                        </div>
                        <span className={`material-symbols-outlined ${active ? "text-[var(--primary)]" : "text-[var(--on-surface-variant)]"}`}>
                          {m.icon}
                        </span>
                      </div>

                      {active && (
                        <div className="mt-5 rounded-lg border border-[var(--outline-variant)]/40 bg-white p-4">
                          {m.value === "bank_transfer" ? (
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-[var(--on-surface-variant)]">Transfer to:</p>
                              <div className="flex items-center justify-between rounded-lg bg-[var(--surface-container-low)] px-4 py-3">
                                <div>
                                  <p className="text-xs text-[var(--on-surface-variant)]">Bank BCA</p>
                                  <p className="font-bold text-[var(--on-surface)] tracking-wider">1234 5678 9012</p>
                                </div>
                                <span className="material-symbols-outlined text-[var(--primary)]">account_balance</span>
                              </div>
                              <div className="flex items-center justify-between rounded-lg bg-[var(--surface-container-low)] px-4 py-3">
                                <div>
                                  <p className="text-xs text-[var(--on-surface-variant)]">Account Name</p>
                                  <p className="font-bold text-[var(--on-surface)]">Terra Padel Indonesia</p>
                                </div>
                              </div>
                              <p className="text-xs text-[var(--on-surface-variant)]">
                                Please include your booking ID <span className="font-mono font-semibold">{booking.id.slice(0, 8).toUpperCase()}</span> as the transfer reference.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-[var(--on-surface-variant)]">Select your e-wallet:</p>
                              <div className="grid grid-cols-2 gap-3">
                                {["GoPay", "OVO", "DANA", "ShopeePay"].map((wallet) => (
                                  <div
                                    key={wallet}
                                    className="flex items-center justify-center rounded-lg border border-[var(--outline-variant)]/40 bg-[var(--surface-container-low)] px-4 py-3 font-semibold text-[var(--on-surface)]"
                                  >
                                    {wallet}
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-[var(--on-surface-variant)]">
                                You will be redirected to complete the payment in your e-wallet app.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="flex items-center gap-3 px-2">
              <span className="material-symbols-outlined text-[var(--primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <p className="text-sm font-medium text-[var(--on-surface-variant)]">
                Secure SSL Connection. Your data is encrypted and protected.
              </p>
            </div>
          </div>

          {/* ── Right: Order Summary ──────────────────────────── */}
          <div className="lg:col-span-5">
            <aside className="sticky top-24 rounded-xl bg-[var(--surface-container-high)] p-8 shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
              <h2 className="font-['Literata'] mb-6 text-2xl font-bold text-[var(--on-surface)]">Order Summary</h2>

              {/* Court visual placeholder */}
              <div className="mb-8 flex h-40 items-center justify-center overflow-hidden rounded-lg bg-[var(--surface-container-highest)]">
                <span className="material-symbols-outlined text-6xl text-[var(--primary)]/30">sports_tennis</span>
              </div>

              <div className="mb-8 space-y-6">
                <div>
                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Location</h3>
                  <p className="font-['Literata'] text-lg text-[var(--on-surface)]">{booking.court.name}</p>
                  <p className="text-sm text-[var(--on-surface-variant)]">{booking.court.location}</p>
                </div>
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Date</h3>
                    <p className="font-medium text-[var(--on-surface)]">{formatDateLong(start)}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Time</h3>
                    <p className="font-medium text-[var(--on-surface)]">{formatTimeRange(start, end)}</p>
                    <p className="text-xs text-[var(--on-surface-variant)]">({durationMinutes(start, end)} min)</p>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="space-y-3 border-t border-[var(--outline-variant)] pt-6">
                <div className="flex justify-between text-[var(--on-surface-variant)]">
                  <span>Court Rental</span>
                  <span className="font-medium">${toDollars(courtRental)}</span>
                </div>
                <div className="flex justify-between text-[var(--on-surface-variant)]">
                  <span>Booking Fee</span>
                  <span className="font-medium">${toDollars(bookingFee)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-[var(--outline-variant)] pt-3 font-['Literata'] text-xl font-bold text-[var(--on-surface)]">
                  <span>Total</span>
                  <span className="text-[var(--primary)]">${toDollars(total)}</span>
                </div>
              </div>

              {payError ? (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{payError}</p>
              ) : null}

              <button
                type="button"
                onClick={handlePay}
                disabled={paying}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:opacity-90 active:scale-95 disabled:opacity-60"
              >
                <span className="material-symbols-outlined">lock</span>
                {paying ? "Processing…" : "Pay Now"}
              </button>

              <p className="mt-4 text-center text-xs leading-relaxed text-[var(--on-surface-variant)]">
                By clicking &ldquo;Pay Now&rdquo;, you agree to Terra Padel&apos;s{" "}
                <span className="cursor-pointer underline hover:text-[var(--primary)]">Booking Policy</span>{" "}
                and{" "}
                <span className="cursor-pointer underline hover:text-[var(--primary)]">Cancellation Terms</span>.
              </p>
            </aside>
          </div>
        </div>
      </main>

      <PlayerFooter />
      <PlayerBottomNav activeTab="courts" />
    </div>
  );
}

import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import PlayerBottomNav from "@/components/player-bottom-nav";
import PlayerFooter from "@/components/player-footer";
import PlayerNavbar from "@/components/player-navbar";
import { db } from "@/db";
import { bookings, courts } from "@/db/schema";
import { getCurrentUserFromServer } from "@/lib/server-session";

function getMembershipTier(hoursPlayed: number) {
  if (hoursPlayed >= 50) return { label: "Ancient Oak Member", badgeClass: "bg-[var(--tertiary-fixed)] text-[var(--tertiary)]" };
  if (hoursPlayed >= 10) return { label: "Sprout Member", badgeClass: "bg-[var(--tertiary-fixed)] text-[var(--tertiary)]" };
  return { label: "Seed Member", badgeClass: "bg-[var(--primary-fixed)] text-[var(--primary)]" };
}

function formatDateTime(date: Date) {
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
    " • " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatNextMatch(date: Date) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  return `${dayLabel} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function durationMinutes(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function bookingStatusBadge(status: string, endTime: Date) {
  const isPast = endTime < new Date();
  if (status === "cancelled") return { label: "CANCELLED", cls: "bg-red-50 text-red-700" };
  if (isPast) return { label: "COMPLETED", cls: "bg-[var(--secondary-container)] text-[var(--on-secondary-container)]" };
  if (status === "confirmed") return { label: "CONFIRMED", cls: "bg-green-50 text-[var(--primary)]" };
  return { label: "PENDING", cls: "bg-amber-50 text-[var(--tertiary)]" };
}

function bookingIcon(status: string, endTime: Date) {
  const isPast = endTime < new Date();
  if (isPast) return "history";
  if (status === "confirmed") return "sports_tennis";
  return "schedule";
}

export default async function ProfilePage() {
  const user = await getCurrentUserFromServer();

  if (!user) {
    redirect("/login?next=/profile");
  }

  if (user.role === "manager") {
    redirect("/manager/overview");
  }

  // Fetch all bookings for this user
  const userBookings = await db
    .select({
      id: bookings.id,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      court: {
        id: courts.id,
        name: courts.name,
        location: courts.location,
      },
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.startTime));

  const now = new Date();

  // Next upcoming booking
  const nextBooking = userBookings
    .filter((b) => b.startTime > now && b.status !== "cancelled")
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0] ?? null;

  // Recent bookings for the list (skip nextBooking)
  const recentBookings = userBookings
    .filter((b) => !(nextBooking && b.id === nextBooking.id))
    .slice(0, 5);

  // Stats
  const completedBookings = userBookings.filter(
    (b) => b.endTime <= now && b.status !== "cancelled",
  );

  const totalHours = completedBookings.reduce((acc, b) => {
    return acc + (b.endTime.getTime() - b.startTime.getTime()) / 3_600_000;
  }, 0);

  // Favorite court (most played)
  const courtCounts = new Map<string, { name: string; count: number }>();
  for (const b of completedBookings) {
    const entry = courtCounts.get(b.court.id);
    if (entry) entry.count += 1;
    else courtCounts.set(b.court.id, { name: b.court.name, count: 1 });
  }
  const favCourt = [...courtCounts.values()].sort((a, b) => b.count - a.count)[0]?.name ?? "—";

  const tier = getMembershipTier(totalHours);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-background)] pb-24 md:pb-0">
      <PlayerNavbar />

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        {/* Welcome Section */}
        <section className="mb-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-['Literata'] text-4xl font-bold text-[var(--on-surface)]">
                Welcome back, {user.name.split(" ")[0]}
              </h1>
              <p className="mt-2 text-lg text-[var(--on-surface-variant)]">
                Your journey is taking root. You&apos;re currently a{" "}
                <span className={`ml-1 rounded-full px-3 py-1 text-sm font-bold ${tier.badgeClass}`}>
                  {tier.label}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/courts"
                className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Book a court
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ── Left Column ─────────────────────────────── */}
          <div className="space-y-8 lg:col-span-8">
            {/* Next Match Card */}
            {nextBooking ? (
              <div className="relative overflow-hidden rounded-xl border border-[var(--outline-variant)]/20 bg-[var(--surface-container-low)] p-1">
                <div className="pointer-events-none absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[var(--primary)]/5 blur-3xl" />
                <div className="relative flex flex-col items-center gap-8 p-6 md:flex-row md:p-8">
                  <div className="w-full shrink-0 overflow-hidden rounded-lg shadow-lg md:w-1/3 md:aspect-square aspect-video">
                    <div className="flex h-full w-full items-center justify-center bg-[var(--surface-container-high)]">
                      <span className="material-symbols-outlined text-6xl text-[var(--primary)]/40">sports_tennis</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--tertiary)]">
                      <span className="material-symbols-outlined text-sm">event</span>
                      Next Match
                    </div>
                    <h2 className="font-['Literata'] text-3xl font-bold text-[var(--on-surface)]">
                      {nextBooking.court.name}
                    </h2>
                    <div className="space-y-2 text-[var(--on-surface-variant)]">
                      <p className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[var(--primary)]">schedule</span>
                        {formatNextMatch(nextBooking.startTime)} — {durationMinutes(nextBooking.startTime, nextBooking.endTime)} min session
                      </p>
                      <p className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[var(--primary)]">location_on</span>
                        {nextBooking.court.location}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-4">
                      <Link
                        href={`/courts/${nextBooking.court.id}`}
                        className="flex items-center gap-2 rounded-lg border border-[var(--primary)]/20 bg-white px-5 py-2.5 font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/5"
                      >
                        <span className="material-symbols-outlined">open_in_new</span>
                        View Court
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--outline-variant)]/50 bg-[var(--surface-container-low)] p-10 text-center">
                <span className="material-symbols-outlined mx-auto mb-4 block text-4xl text-[var(--primary)]/40">sports_tennis</span>
                <p className="font-semibold text-[var(--on-surface-variant)]">No upcoming matches</p>
                <Link href="/courts" className="mt-4 inline-block rounded-lg bg-[var(--primary)] px-5 py-2.5 font-semibold text-white hover:opacity-90">
                  Book a court
                </Link>
              </div>
            )}

            {/* My Bookings */}
            <div className="rounded-xl bg-white p-8 shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-['Literata'] text-2xl font-bold text-[var(--on-surface)]">My Bookings</h3>
                <Link href="/courts" className="text-sm font-semibold text-[var(--primary)] hover:underline">
                  Book more
                </Link>
              </div>
              {recentBookings.length === 0 ? (
                <p className="text-center text-sm text-[var(--on-surface-variant)] py-8">No bookings yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentBookings.map((b) => {
                    const badge = bookingStatusBadge(b.status, b.endTime);
                    const icon = bookingIcon(b.status, b.endTime);
                    return (
                      <div
                        key={b.id}
                        className="group flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-[var(--surface-container-low)]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                            <span className="material-symbols-outlined">{icon}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-[var(--on-surface)]">{b.court.name}</h4>
                            <p className="text-sm text-[var(--on-surface-variant)]">{formatDateTime(b.startTime)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>
                            {badge.label}
                          </span>
                          <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                            {durationMinutes(b.startTime, b.endTime)} min
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column ─────────────────────────────── */}
          <div className="space-y-8 lg:col-span-4">
            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex h-40 flex-col justify-between rounded-xl bg-[var(--primary)] p-6 shadow-lg text-white">
                <span className="material-symbols-outlined self-end text-4xl opacity-50">military_tech</span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Account</p>
                  <h4 className="font-['Literata'] text-3xl font-bold">{user.name.split(" ")[0]}</h4>
                  <p className="text-xs opacity-70 mt-0.5">{user.email}</p>
                </div>
              </div>
              <div className="flex h-36 flex-col justify-between rounded-xl bg-[var(--surface-container-highest)] p-5">
                <span className="material-symbols-outlined text-[var(--primary)]">timer</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[var(--on-surface-variant)]">Hours Played</p>
                  <h4 className="font-['Literata'] text-2xl font-bold text-[var(--on-surface)]">
                    {totalHours.toFixed(1)}h
                  </h4>
                </div>
              </div>
              <div className="flex h-36 flex-col justify-between rounded-xl bg-[var(--tertiary-fixed)] p-5">
                <span className="material-symbols-outlined text-[var(--tertiary)]">favorite</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[var(--on-surface-variant)]">Fav Court</p>
                  <h4 className="font-['Literata'] text-xl font-bold leading-tight text-[var(--on-surface)]">
                    {favCourt}
                  </h4>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="ml-1 font-['Literata'] text-xl font-bold text-[var(--on-surface)]">Quick Actions</h3>
              {[
                { href: "/lessons", icon: "school", label: "Find a coach", sublabel: "Level up your game" },
                { href: "/memberships", icon: "card_membership", label: "View memberships", sublabel: "Explore available plans" },
                { href: "/events", icon: "event", label: "Browse events", sublabel: "Join upcoming sessions" },
              ].map(({ href, icon, label, sublabel }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex w-full items-center gap-4 rounded-xl border border-[var(--outline-variant)]/30 bg-white p-4 transition-all hover:border-[var(--primary)]/40 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--surface-container)] text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[var(--on-surface)]">{label}</p>
                    <p className="text-xs text-[var(--on-surface-variant)]">{sublabel}</p>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-stone-300 transition-colors group-hover:text-[var(--primary)]">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>

            {/* Promo / Tip Card */}
            <div className="rounded-xl border-2 border-dashed border-[var(--secondary-fixed-dim)] bg-[var(--secondary-container)]/50 p-6">
              <p className="font-['Literata'] text-sm italic leading-relaxed text-[var(--on-secondary-container)]">
                &ldquo;The foundation of a great padel game is not the power of the smash, but the patience of the lob.&rdquo;
              </p>
              <p className="mt-3 text-xs font-bold text-[var(--secondary)]">— Terra Pro Tip</p>
            </div>
          </div>
        </div>
      </main>

      <PlayerFooter />
      <PlayerBottomNav activeTab="home" />
    </div>
  );
}
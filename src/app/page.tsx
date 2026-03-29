"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import PlayerBottomNav from "@/components/player-bottom-nav";
import PlayerFooter from "@/components/player-footer";
import PlayerNavbar from "@/components/player-navbar";

const homeNavItems = [
  { key: "courts", label: "Find a Court", href: "/courts" },
  { key: "memberships", label: "Memberships", href: "/memberships" },
  { key: "lessons", label: "Lessons", href: "/lessons" },
  { key: "events", label: "Events", href: "/events" },
];

export default function Home() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; role: "player" | "manager"; name: string } | null>(null);

  const loadMe = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return;
      }

      const json = (await res.json()) as { data: { id: string; role: "player" | "manager"; name: string } };
      setUser(json.data);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    void loadMe();
  }, []);

  const onLogout = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => null);
    setUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PlayerNavbar
        activeTab="courts"
        navItems={homeNavItems}
        desktopTrailingLinks={[{ label: "For Managers", href: "/manager" }]}
        rightContent={
          authLoading ? (
            <span className="px-3 py-2 text-sm text-stone-500">Checking session...</span>
          ) : user ? (
            <>
              <Link href={user.role === "manager" ? "/manager/overview" : "/profile"} className="px-3 py-2 font-semibold text-stone-600 transition-colors hover:text-[var(--primary)] md:px-5">
                Dashboard
              </Link>
              <button onClick={() => void onLogout()} className="rounded-lg bg-stone-700 px-4 py-2.5 font-bold text-white transition-opacity hover:opacity-90 md:px-6">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowAuth(true)} className="px-3 py-2 font-semibold text-stone-600 transition-colors hover:text-[var(--primary)] md:px-5">
                Login
              </button>
              <button onClick={() => setShowAuth(true)} className="rounded-lg bg-[var(--primary)] px-4 py-2.5 font-bold text-white transition-opacity hover:opacity-90 md:px-6">
                Sign Up
              </button>
            </>
          )
        }
      />

      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl md:p-12">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg text-[var(--outline)] transition-colors hover:bg-[var(--surface-container-low)]"
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
      )}

      <main>
        <section className="relative flex min-h-[760px] items-center overflow-hidden md:min-h-[870px]">
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAP98-fek1CbUcs_zqiW7BnA_kDS_1gVuzRC54WUaNE9OsO0dD7ukm8cUIFXNoOdkXpcY-O53jQJq5gi7f3XnXIeH9-KMf4ANaUWLktX8HCo5x3xkoURZ_-by7hHgBcNQ4Sfhxaj68EjgjY7UxYgFGaJieUS0vXVn_eaRSMZG-fRLCdx28tvrMOjjk3YAHB6_RwR6gREg8A_nbIsfNwjTd5L9MaU7vDY7B9at0Y3tN64rfgmJvv4DdZxccbfdb9LAd3URBqeFDX-1Y"
              alt="Modern outdoor padel court with tropical trees"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#faf6f0] via-[#faf6f0]/80 to-transparent" />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-7xl px-5 md:px-8">
            <div className="max-w-2xl">
              <span className="mb-6 inline-block rounded-full border border-[var(--tertiary-container)]/30 bg-[var(--tertiary-container)]/20 px-4 py-1.5 text-sm font-bold text-[#554020]">
                New Courts Available
              </span>
              <h1 className="mb-6 text-5xl leading-tight font-bold md:text-7xl md:leading-[1.1]">
                Rooted in Play, <span className="italic text-[var(--primary)]">Booked in Seconds.</span>
              </h1>
              <p className="mb-10 text-lg leading-relaxed text-[var(--on-surface-variant)] md:text-xl">
                The simplest way to find, book, and play padel. Join the community and get on the court instantly with our seamless booking experience.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/courts" className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5">
                  <span className="material-symbols-outlined">search</span>
                  Find a Court Near You
                </Link>
                <Link href="/manager" className="rounded-lg border-2 border-[var(--primary)]/20 bg-white px-8 py-4 text-lg font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary-fixed)]/30">
                  List Your Court
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-5 md:mt-12 md:gap-6">
                <div className="flex -space-x-3">
                  <img
                    className="h-10 w-10 rounded-full border-2 border-[#faf6f0] object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAi93DWOfEVd0xkMsaeRByZjYY2n2xqvIzicbzam71dfSGUNlQcvErvWOqyMt0BH9-TOFS0xJa6xulS6sAWnpSphO-Z-BWMXO9lG-lVYlAvzvLH6MhTJkW1Jk62N2SSjqreq-ToyJUO-KNbnzglqWODnKK-6K5XtwunMAmbpQskH7T5NSlDjSeTtECoHZ6Ar8oX4OshIHgcH7v2A7c7UwYrrHA621Azu8H_4G2G7WZsDfmMN6qsu8u2_yDzwLMj8pRtgkiHk1ZTLwU"
                    alt="Player avatar"
                  />
                  <img
                    className="h-10 w-10 rounded-full border-2 border-[#faf6f0] object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9IFdsiMc0Do117rcgNGpA0veultdGDy66CSSs7tkOzqdLTavVOFWRaUaH5NSbt1QRQtXwhvW4GIIexZUiqdq00DVG5gMJcha3KdSo8u1oKu3yPy6_sQ3Hb-qQc2OL3YwL7egg7F0ul-0zYMR_TPLf9IgEykx9ops5hcPWalKjQdSGmmAoDsmY20Zd9Pl8seHhDZUKgrgT00iiO5_POtzWppPmgLY905hl0lnYhdkO2HNrndM44QJoaONhKmEwpA9hlvZwxNUvEhE"
                    alt="Player avatar"
                  />
                  <img
                    className="h-10 w-10 rounded-full border-2 border-[#faf6f0] object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3Y84LlLTH1KyMcpo9SdU2-GsoRVSPABdTnMcvT2s1rsCh2EPYNtN3acLZaP37S5H7fKBHG_WQR8gUEXwvjIh5DaQJxNJtQKZDG_5mMv8JIVRM5pKfz62lMlnpbPRvesgkXY6l3rRX4Fvxm9MIi1kvBuuIW3ie0bYvjb27aYpQIRgQ4pwh3iBqf64lR5argK4zjcn7b-JdHq2VV9Me8l4FIxCzqb-Qvh1gkWX2NPCGQoA-DHwMTVzH2CDVUMcUglGqnshLOo28iW4"
                    alt="Player avatar"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#faf6f0] bg-[var(--secondary-container)] text-xs font-bold text-[#5e5548]">
                    12k+
                  </div>
                </div>
                <p className="text-sm text-[var(--on-surface-variant)]">
                  Trusted by <span className="font-bold text-[var(--foreground)]">12,000+ players</span> worldwide
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--surface)] py-20 md:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
            <div className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
              <h2 className="mb-4 text-4xl font-bold">Elevate Your Game</h2>
              <p className="text-lg text-[var(--on-surface-variant)]">
                Everything you need to spend less time managing and more time on the court.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {[
                ["bolt", "Instant Booking", "Real-time availability at your fingertips. No back-and-forth calls, just select and play."],
                ["account_balance_wallet", "Integrated Payments", "Secure checkout via bank transfer or e-wallets. Easy split-pay options coming soon."],
                ["group", "Community Driven", "Verified ratings and reviews for every court. Know exactly where you're playing."],
                ["dashboard", "Manager Dashboard", "Powerful tools for court owners to manage schedules, staff, and grow revenue."],
              ].map(([icon, title, copy]) => (
                <article
                  key={title}
                  className="group rounded-xl border border-transparent bg-[var(--surface-container-low)] p-8 transition-all hover:border-[var(--primary)]/10 hover:bg-[var(--surface-container)]"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-3xl">{icon}</span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{title}</h3>
                  <p className="leading-relaxed text-[var(--on-surface-variant)]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--surface-container-lowest)] py-20 md:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
            <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="mb-4 text-4xl font-bold">Featured Courts</h2>
                <p className="text-lg text-[var(--on-surface-variant)]">Top-rated locations trending this week in your area.</p>
              </div>
              <Link href="/courts" className="flex items-center gap-2 font-bold text-[var(--primary)] transition-all hover:gap-3">
                View All Locations <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                [
                  "Terra Club Green",
                  "$25 / hr",
                  "4.9",
                  "South Hills, District 4",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuB9R6WACWwJEve1JUV6nSfUNtCoRe96lUdn4AAciNrsK4rbsh8KcxeNsFA9cFpw-fj8xZkja7mGAxLguKkKhpdadhVIHOvvxXThUgLY0WQKZgHA8IFy0i4Ch5aYIX4YWk-dRgKwyOaIyO0m2NSnokeZ-7SnMms8ahe9kdb5hXstijhkQk_RNA8h_dSRdnmjpa7nqh3cB5RTzjlFQ8Z7UUoLTXRrcQAkFdctyetV_I6oGo_lI4phLEP4vxr78bCwoJTP0F18IpgsTJA",
                ],
                [
                  "Sky Padel Jakarta",
                  "$35 / hr",
                  "4.8",
                  "CBD Rooftop Plaza",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuCE2vyZCe_IJrQ9AifaP4wPO9A4Kez-bn3ysBI3beXRr1O2S1EC1vISj9tGFzxTVRw-zxrGHL2X6T1V6mbALo9ouwtTPfnKuwBz8S6RilUJ7LWdbnN7eC0wnRjrajemExoloc7p5oN9KBYW5LhlgNfiwn4ShiV3hsYN1DuO7V9htV55pAWkwS-46lNy_o957IU9z0UIqc3Bn0BqAn88jizkB933Wpm4pcA_H5JN-c2WwfUvHD36IQ09YSSX5XgOJE57iliXeW526LM",
                ],
                [
                  "The Grove Padel",
                  "$20 / hr",
                  "4.7",
                  "West Park Gardens",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuDkTjX3-q-eddHljGAF9CPZtsRPsVbRirq7vtaPZVgRxY8fu1Qa70-cbEr2SGMYUDpziFIvP1k_D2t4JgkTIblOodSlN5AfjbBnRCI3_ETf0ysLlcNH70bSsF9yjgmChjdn3bKDcqLB4ZbExA5CRhktA0GarMmvyJ7ogcTeuri0Kwt5wmc2WdDTkzxYTacxlccE0on0a_tWZHizsQcoJz_eI22qP2u0Xac1DHtRThega3WTUa_JldmPKglVOkIkwYDjrtpSRZfH-h0",
                ],
              ].map(([name, price, rating, location, image]) => (
                <article
                  key={name}
                  className="group overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_rgba(46,50,48,0.06)] transition-all hover:shadow-xl"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" src={image} alt={name} />
                    <div className="absolute top-4 right-4 rounded-full bg-[#faf6f0]/90 px-3 py-1 text-xs font-bold text-[var(--primary)] backdrop-blur">
                      {price}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="text-xl font-bold">{name}</h3>
                      <div className="flex items-center gap-1 text-[var(--tertiary)]">
                        <span className="material-symbols-outlined fill-icon text-sm">star</span>
                        <span className="text-sm font-bold">{rating}</span>
                      </div>
                    </div>
                    <div className="mb-6 flex items-center gap-1 text-sm text-[var(--on-surface-variant)]">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {location}
                    </div>
                    <Link href="/courts" className="block w-full rounded-lg bg-[var(--primary)]/10 py-3 text-center font-bold text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                      Book Now
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#faf6f0] py-20 md:py-24">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 md:px-8 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8">
              <h2 className="text-4xl leading-tight font-bold md:text-5xl">
                Voices of the <span className="text-[var(--tertiary)]">Terra</span> Community.
              </h2>
              <article className="relative rounded-2xl bg-[var(--surface-container)] p-8 italic shadow-sm md:p-10">
                <span className="material-symbols-outlined absolute -top-4 -left-4 text-7xl text-[var(--primary)]/20">format_quote</span>
                <p className="mb-6 text-lg leading-relaxed md:text-xl">
                  "Terra Padel has completely changed how I organize my weekly matches. I used to spend 30 minutes messaging groups and calling clubs. Now it takes 30 seconds."
                </p>
                <div className="flex items-center gap-4 not-italic">
                  <img
                    className="h-12 w-12 rounded-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHO_PHY1jR7MKY4kW5E2DsJCJBc7VOHDZLSoijla-a8X3Tpqy1rhefWyDe-FY4Hm83xlHTgJx9vt2PXgN7Y_Akk8f0PeJD23hFo_6MPmDSB1nJBuxbiA5mVNxFtFiF6ShGHRC4TxVlYpFsYeCdu1nrSeOZvIrkO_m7shX-bGHow_XYto51_sJTO2Rs4vSAUTC7iqXKda6entHApFIJWqZF_CineLmUwsUSeoKcnGoGm0mdOjqUfWtbYKAWudAa5l7MyFoRiEtkeI4"
                    alt="Alex Rivera"
                  />
                  <div>
                    <h4 className="font-bold">Alex Rivera</h4>
                    <p className="text-sm text-[var(--on-surface-variant)]">Competitive Player</p>
                  </div>
                </div>
              </article>
            </div>

            <div className="grid gap-8">
              <article className="flex flex-col gap-6 rounded-xl border border-[var(--outline-variant)]/30 bg-white p-8">
                <p className="text-lg text-[var(--on-surface-variant)]">
                  "As a court manager, the dashboard is a lifesaver. Our booking rates increased by 40% in the first month because of the ease of use for our clients."
                </p>
                <div className="flex items-center gap-4">
                  <img
                    className="h-12 w-12 rounded-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgwC4F9Pl37TyRmkHorAzEwWalBFDm5Q_ltp_yVGUf0d62DISFmrGebxME0j_uvsaSFPZKDzFjjaBm6KpUj7tWH_mXOTQBP8Pl8fYmWBAL7Kl_cmr9zKZg2XLOyxkL9jLfj0NNkgMIz5u_LeXfsAao3dAXuB66wT_LzJmeI1hlkPFfJhnTZRHzRU_vudcli9s9MkyhrvVUL4zF30znVfGhVD5XHFZCq-ihOWttScGNDtCaFQGQ_HutYbc987n6PYxUrTGk60ooWLM"
                    alt="Mark Thompson"
                  />
                  <div>
                    <h4 className="font-bold">Mark Thompson</h4>
                    <p className="text-sm text-[var(--on-surface-variant)]">Manager at Sky Padel</p>
                  </div>
                </div>
              </article>

              <article className="flex flex-col items-center rounded-xl bg-[var(--primary)] p-10 text-center text-white md:p-12">
                <h3 className="mb-4 text-2xl font-bold italic">Ready to get on court?</h3>
                <p className="mb-8 opacity-90">Join thousands of players and managers already using Terra Padel.</p>
                <button onClick={() => setShowAuth(true)} className="rounded-lg bg-white px-10 py-4 font-bold text-[var(--primary)] transition-transform hover:scale-105">
                  Get Started Free
                </button>
              </article>
            </div>
          </div>
        </section>
      </main>

      <PlayerFooter />
      <PlayerBottomNav activeTab="home" />
    </div>
  );
}

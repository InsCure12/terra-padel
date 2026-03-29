"use client";

import Link from "next/link";
import { useEffect, useState, ReactNode } from "react";

export type PlayerNavKey = "courts" | "memberships" | "lessons" | "events";

type PlayerNavItem = {
  key: string;
  label: string;
  href: string;
};

type PlayerNavbarProps = {
  activeTab?: string;
  navItems?: PlayerNavItem[];
  desktopTrailingLinks?: Array<{ label: string; href: string }>;
  rightContent?: ReactNode;
  showBookNow?: boolean;
};

const defaultTabs: PlayerNavItem[] = [
  { key: "courts", label: "Courts", href: "/courts" },
  { key: "memberships", label: "Memberships", href: "/memberships" },
  { key: "lessons", label: "Lessons", href: "/lessons" },
  { key: "events", label: "Events", href: "/events" },
];

type CurrentUser = {
  id: string;
  role: "player" | "manager";
};

export default function PlayerNavbar({
  activeTab,
  navItems = defaultTabs,
  desktopTrailingLinks = [],
  rightContent,
  showBookNow = false,
}: PlayerNavbarProps) {
  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const loadMe = async () => {
      setLoadingUser(true);
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          setUser(null);
          return;
        }
        const json = (await res.json()) as { data: CurrentUser };
        setUser(json.data);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    void loadMe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/50 bg-[#faf6f0] shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-[var(--primary)]">
          Terra Padel
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={active
                  ? "border-b-2 border-[var(--primary)] pb-1 font-bold text-[var(--primary)]"
                  : "font-medium text-stone-600 transition-colors hover:text-[var(--primary)]"
                }
              >
                {tab.label}
              </Link>
            );
          })}
          {desktopTrailingLinks.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium text-stone-600 transition-colors hover:text-[var(--primary)]">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {rightContent ?? (
            loadingUser ? (
              <span className="px-3 py-2 text-sm text-stone-500">Checking session...</span>
            ) : user ? (
              <Link
                href={user.role === "manager" ? "/manager/overview" : "/profile"}
                className="rounded-lg bg-[var(--primary)] px-4 py-2.5 font-bold text-white transition-opacity hover:opacity-90"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-3 py-2 font-semibold text-stone-600 transition-colors hover:text-[var(--primary)] md:px-5">
                  Login
                </Link>
                <Link href="/login" className="rounded-lg bg-[var(--primary)] px-4 py-2.5 font-bold text-white transition-opacity hover:opacity-90 md:px-6">
                  Sign Up
                </Link>
              </>
            )
          )}
          {showBookNow ? (
            <Link href="/courts" className="rounded-lg bg-[var(--primary)] px-5 py-2 font-semibold text-white transition-all hover:opacity-90 active:scale-95">
              Book Now
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}

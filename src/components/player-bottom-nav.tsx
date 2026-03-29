import Link from "next/link";
import { PlayerNavKey } from "@/components/player-navbar";

type PlayerBottomNavProps = {
  activeTab: PlayerNavKey | "home";
};

const items: Array<{ key: PlayerNavKey | "home"; label: string; href: string; icon: string }> = [
  { key: "home", label: "Home", href: "/", icon: "home" },
  { key: "courts", label: "Courts", href: "/courts", icon: "sports_tennis" },
  { key: "memberships", label: "Memberships", href: "/memberships", icon: "card_membership" },
  { key: "lessons", label: "Lessons", href: "/lessons", icon: "school" },
  { key: "events", label: "Events", href: "/events", icon: "event" },
];

export default function PlayerBottomNav({ activeTab }: PlayerBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-[#faf6f0]/92 px-3 pt-2 pb-5 shadow-[0_-4px_20px_rgba(46,50,48,0.05)] backdrop-blur-md md:hidden">
      <div className="mx-auto grid max-w-2xl grid-cols-5 gap-2">
        {items.map((item) => {
          const active = item.key === activeTab;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={active
                ? "flex flex-col items-center justify-center rounded-2xl bg-[var(--primary)] px-2 py-2 text-white"
                : "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-stone-500 transition-colors hover:bg-white/70 hover:text-[var(--primary)]"
              }
            >
              <span className={`material-symbols-outlined text-[20px] ${active ? "fill-icon" : ""}`}>{item.icon}</span>
              <span className="mt-1 text-[10px] font-semibold tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
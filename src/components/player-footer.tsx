import Link from "next/link";

export default function PlayerFooter() {
  return (
    <footer className="border-t border-stone-200/80 bg-[#f7f1e8]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 md:flex-row md:items-start md:justify-between md:px-8">
        <div className="max-w-sm">
          <span className="mb-3 block text-xl font-bold text-[var(--primary)]">Terra Padel</span>
          <p className="text-sm leading-relaxed text-stone-600">
            A calmer booking experience for players and a cleaner operating system for court managers.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm text-stone-600 sm:grid-cols-3">
          <div className="space-y-3">
            <p className="font-bold uppercase tracking-[0.2em] text-stone-500">Explore</p>
            <Link className="block transition-colors hover:text-[var(--primary)]" href="/courts">Courts</Link>
            <Link className="block transition-colors hover:text-[var(--primary)]" href="/memberships">Memberships</Link>
            <Link className="block transition-colors hover:text-[var(--primary)]" href="/lessons">Lessons</Link>
          </div>
          <div className="space-y-3">
            <p className="font-bold uppercase tracking-[0.2em] text-stone-500">Community</p>
            <Link className="block transition-colors hover:text-[var(--primary)]" href="/events">Events</Link>
            <Link className="block transition-colors hover:text-[var(--primary)]" href="/manager">For Managers</Link>
            <Link className="block transition-colors hover:text-[var(--primary)]" href="/login">Login</Link>
          </div>
          <div className="space-y-3">
            <p className="font-bold uppercase tracking-[0.2em] text-stone-500">Promise</p>
            <p>Fast court discovery</p>
            <p>Thoughtful clubhouse design</p>
            <p>Built for repeat play</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
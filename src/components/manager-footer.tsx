export default function ManagerFooter() {
  return (
    <footer className="border-t border-stone-200/70 bg-[#f7f1e8]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 text-sm text-stone-500 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="font-semibold text-[var(--primary)]">Terra Padel Manager</p>
          <p className="mt-1">Track bookings, courts, and revenue from one operating view.</p>
        </div>
        <div className="flex flex-wrap gap-5">
          <span>Operations-first dashboard</span>
          <span>Live booking visibility</span>
          <span>Inventory awareness</span>
        </div>
      </div>
    </footer>
  );
}
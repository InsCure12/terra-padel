"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import ManagerMetricCard from "@/components/manager-metric-card";
import ManagerPanel from "@/components/manager-panel";
import ManagerShell from "@/components/manager-shell";

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  rentedCount: number;
  unitPrice: number;
  reorderLevel: number;
};

type InventoryResponse = {
  data: {
    items: InventoryItem[];
    stats: {
      totalValue: number;
      lowStockItems: number;
      currentlyRented: number;
    };
  };
};

const initialForm = {
  name: "",
  sku: "",
  category: "Rackets",
  quantity: 0,
  rentedCount: 0,
  unitPrice: 0,
  reorderLevel: 5,
};

function itemStatus(item: InventoryItem) {
  if (item.quantity === 0) return "out";
  if (item.quantity <= item.reorderLevel) return "low";
  return "in";
}

const STATUS_UI = {
  in: { dot: "bg-[var(--primary)]", label: "text-[var(--primary)]", text: "In Stock" },
  low: { dot: "bg-[var(--tertiary)]", label: "text-[var(--tertiary)]", text: "Low Stock" },
  out: { dot: "bg-[var(--error)]", label: "text-[var(--error)]", text: "Out of Stock" },
} as const;

export default function ManagerInventoryPage() {
  const [data, setData] = useState<InventoryResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("Any");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const load = async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/manager/inventory?q=${encodeURIComponent(search)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load inventory");
      const json: InventoryResponse = await res.json();
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const categories = useMemo(() => {
    const vals = new Set((data?.items ?? []).map((item) => item.category));
    return Array.from(vals);
  }, [data]);

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((item) => {
      const status = itemStatus(item);
      const matchesCat = categoryFilter === "All Categories" || item.category === categoryFilter;
      const matchesStatus =
        statusFilter === "Any" ||
        (statusFilter === "In Stock" && status === "in") ||
        (statusFilter === "Low Stock" && status === "low") ||
        (statusFilter === "Out of Stock" && status === "out");
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.sku.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesStatus && matchesQuery;
    });
  }, [data, categoryFilter, statusFilter, query]);

  const onAdd = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/manager/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm(initialForm);
      setShowModal(false);
      void load(query);
    }
  };

  const onDelete = async (id: string) => {
    const res = await fetch("/api/manager/inventory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) void load(query);
  };

  return (
    <ManagerShell
      activeTab="inventory"
      title="Inventory"
      subtitle="Manage club equipment and rental assets"
      actions={
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-[var(--secondary-container)] px-5 py-2.5 text-sm font-semibold text-[var(--on-secondary-container)] hover:opacity-90 transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">file_download</span>
            Export Report
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Item
          </button>
        </div>
      }
    >
      {/* Add Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg text-[var(--outline)] hover:bg-[var(--surface-container-low)] transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="mb-1 text-2xl font-bold text-[var(--on-surface)]">Add New Item</h3>
            <p className="mb-6 text-sm text-stone-500">Add equipment or rental assets to your inventory.</p>
            <form onSubmit={onAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-500">Item Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    className="w-full rounded-lg border border-stone-200 bg-[var(--surface-container-low)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                    placeholder="e.g. Bullpadel Vertex 04"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-500">SKU</label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
                    className="w-full rounded-lg border border-stone-200 bg-[var(--surface-container-low)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                    placeholder="RACK-001"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-500">Category</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                    className="w-full rounded-lg border border-stone-200 bg-[var(--surface-container-low)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                    placeholder="Rackets"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-500">Quantity</label>
                  <input
                    type="number" min={0}
                    value={form.quantity}
                    onChange={(e) => setForm((s) => ({ ...s, quantity: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-stone-200 bg-[var(--surface-container-low)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-500">Unit Price</label>
                  <input
                    type="number" min={0}
                    value={form.unitPrice}
                    onChange={(e) => setForm((s) => ({ ...s, unitPrice: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-stone-200 bg-[var(--surface-container-low)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-500">Reorder Level</label>
                  <input
                    type="number" min={0}
                    value={form.reorderLevel}
                    onChange={(e) => setForm((s) => ({ ...s, reorderLevel: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-stone-200 bg-[var(--surface-container-low)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-lg bg-[var(--primary)] py-3 text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
              >
                {submitting ? "Adding…" : "Add to Inventory"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <ManagerMetricCard
            label="Total Asset Value"
            value={`$${(data?.stats.totalValue ?? 0).toLocaleString()}`}
            helper="Across all rentable and operational items"
            icon="payments"
            iconWrapClassName="bg-[var(--primary)]/10 text-[var(--primary)]"
            className="bg-[var(--primary-container)]/20 md:col-span-2"
          />
          <ManagerMetricCard
            label="Low Stock Items"
            value={String(data?.stats.lowStockItems ?? 0).padStart(2, "0")}
            helper="Requires immediate replenishment"
            icon="warning"
            iconWrapClassName="bg-[var(--tertiary)]/10 text-[var(--tertiary)]"
            valueClassName="text-[var(--error)]"
            className="bg-[var(--surface-container)]"
          />
          <ManagerMetricCard
            label="Currently Rented"
            value={String(data?.stats.currentlyRented ?? 0).padStart(2, "0")}
            helper="Items allocated to active bookings"
            icon="shopping_bag"
            iconWrapClassName="bg-[var(--secondary-container)] text-[var(--primary)]"
            valueClassName="text-[var(--tertiary)]"
            className="bg-[var(--surface-container)]"
          />
        </div>

        <ManagerPanel title="Inventory Register" subtitle="Filter, search, and act on all club assets">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 p-6">
            <div className="flex flex-wrap gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border-none bg-[var(--surface-container-low)] px-4 py-2 text-sm text-stone-600 focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option>All Categories</option>
                {categories.map((cat) => <option key={cat}>{cat}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border-none bg-[var(--surface-container-low)] px-4 py-2 text-sm text-stone-600 focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="Any">Status: Any</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">search</span>
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); void load(e.target.value); }}
                  placeholder="Search assets…"
                  className="rounded-lg border-none bg-[var(--surface-container-low)] py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
            <span className="text-sm text-stone-400">Showing {filteredItems.length} of {data?.items.length ?? 0} items</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-stone-400">
              <span className="material-symbols-outlined mr-2 animate-spin">refresh</span>
              Loading…
            </div>
          ) : null}
          {error ? <p className="px-6 py-4 text-sm text-red-600">{error}</p> : null}

          {!loading && data ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 bg-[var(--surface-container-low)] text-xs font-semibold uppercase tracking-widest text-stone-500">
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Total Quantity</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredItems.map((item) => {
                    const status = itemStatus(item);
                    const ui = STATUS_UI[status];
                    return (
                      <tr key={item.id} className="group transition-colors hover:bg-stone-50/50">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--surface-container-high)] text-[var(--primary)]">
                              <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <div>
                              <p className="font-bold text-stone-800">{item.name}</p>
                              <p className="text-xs text-stone-400">SKU: {item.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="rounded-full bg-[var(--secondary-container)]/50 px-3 py-1 text-xs font-semibold text-[var(--on-secondary-container)]">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${ui.dot}`} />
                            <span className={`text-sm font-medium ${ui.label}`}>{ui.text}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className={`text-lg font-bold ${status !== "in" ? ui.label : "text-stone-800"}`}>
                            {String(item.quantity).padStart(2, "0")}{" "}
                            <span className="text-sm font-normal text-stone-400">units</span>
                          </p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="p-2 text-stone-400 transition-colors hover:text-[var(--primary)]">
                            <span className="material-symbols-outlined">edit_note</span>
                          </button>
                          <button
                            onClick={() => void onDelete(item.id)}
                            className="p-2 text-stone-400 transition-colors hover:text-[var(--error)]"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-stone-400">
                        No items found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </ManagerPanel>

        {/* Contextual bento */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="relative lg:col-span-2 overflow-hidden rounded-xl bg-[var(--inverse-surface)] p-8 text-[var(--inverse-on-surface)]">
            <div className="absolute -right-10 -top-5 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span>
            </div>
            <div className="relative z-10 space-y-4">
              <span className="rounded-full bg-[var(--tertiary)] px-3 py-1 text-xs font-bold uppercase text-[var(--on-tertiary)]">
                Automatic Reorder
              </span>
              <h4 className="text-2xl font-bold">Never run out of balls.</h4>
              <p className="max-w-sm text-sm text-stone-300">
                Connect your inventory with partner suppliers to automatically restock when items hit "Low Stock" status.
              </p>
              <button className="flex items-center gap-2 font-bold text-[var(--primary-fixed-dim)] group mt-2">
                Configure integration
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-[var(--tertiary)]/20 bg-[var(--tertiary-container)]/30 p-8">
            <div>
              <h4 className="text-xl font-bold text-[var(--on-tertiary-container)]">Maintenance Log</h4>
              <p className="mt-2 text-sm text-[var(--on-tertiary-container)]/70">
                {(data?.stats.lowStockItems ?? 0) > 0
                  ? `${data?.stats.lowStockItems} item(s) are at or below reorder level.`
                  : "All items are well stocked. Great job!"}
              </p>
            </div>
            <button className="mt-6 w-full rounded-lg border border-[var(--tertiary)]/40 py-3 text-sm font-semibold text-[var(--on-tertiary-container)] transition-colors hover:bg-[var(--tertiary)]/10">
              View Maintenance Log
            </button>
          </div>
        </div>
      </div>
    </ManagerShell>
  );
}


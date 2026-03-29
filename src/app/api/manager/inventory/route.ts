import { and, asc, eq, like, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { requireManager } from "@/lib/session";

export const runtime = "nodejs";

const createItemSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  category: z.string().min(2),
  quantity: z.number().int().min(0),
  rentedCount: z.number().int().min(0).default(0),
  unitPrice: z.number().int().min(0),
  reorderLevel: z.number().int().min(0).default(5),
});

const updateItemSchema = createItemSchema.partial().extend({
  id: z.string().min(1),
});

const deleteItemSchema = z.object({
  id: z.string().min(1),
});

export async function GET(request: Request) {
  const manager = await requireManager(request);
  if (manager instanceof NextResponse) {
    return manager;
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();

  const filters = [eq(inventoryItems.managerId, manager.id)];
  if (q) {
    filters.push(like(inventoryItems.name, `%${q}%`));
  }
  if (category && category !== "all") {
    filters.push(eq(inventoryItems.category, category));
  }

  const items = await db
    .select()
    .from(inventoryItems)
    .where(and(...filters))
    .orderBy(asc(inventoryItems.name));

  const [summary] = await db
    .select({
      totalValue: sql<number>`coalesce(sum(${inventoryItems.quantity} * ${inventoryItems.unitPrice}), 0)`,
      lowStockItems: sql<number>`coalesce(sum(case when ${inventoryItems.quantity} <= ${inventoryItems.reorderLevel} then 1 else 0 end), 0)`,
      currentlyRented: sql<number>`coalesce(sum(${inventoryItems.rentedCount}), 0)`,
    })
    .from(inventoryItems)
    .where(eq(inventoryItems.managerId, manager.id));

  return NextResponse.json({
    data: {
      items,
      stats: {
        totalValue: summary?.totalValue ?? 0,
        lowStockItems: summary?.lowStockItems ?? 0,
        currentlyRented: summary?.currentlyRented ?? 0,
      },
    },
  });
}

export async function POST(request: Request) {
  const manager = await requireManager(request);
  if (manager instanceof NextResponse) {
    return manager;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createItemSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(inventoryItems)
    .values({
      managerId: manager.id,
      ...parsed.data,
    })
    .returning();

  return NextResponse.json({ data: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const manager = await requireManager(request);
  if (manager instanceof NextResponse) {
    return manager;
  }

  const payload = await request.json().catch(() => null);
  const parsed = updateItemSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const [updated] = await db
    .update(inventoryItems)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.managerId, manager.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: Request) {
  const manager = await requireManager(request);
  if (manager instanceof NextResponse) {
    return manager;
  }

  const payload = await request.json().catch(() => null);
  const parsed = deleteItemSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [deleted] = await db
    .delete(inventoryItems)
    .where(and(eq(inventoryItems.id, parsed.data.id), eq(inventoryItems.managerId, manager.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  }

  return NextResponse.json({ data: deleted });
}

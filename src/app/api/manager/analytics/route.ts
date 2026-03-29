import { and, eq, gte, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, courts, inventoryItems, payments, reviews, users } from "@/db/schema";
import { requireManager } from "@/lib/session";

export const runtime = "nodejs";

function monthRange(base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const prevStart = new Date(base.getFullYear(), base.getMonth() - 1, 1);
  const prevEnd = start;
  return { start, end, prevStart, prevEnd };
}

export async function GET(request: Request) {
  const manager = await requireManager(request);
  if (manager instanceof NextResponse) {
    return manager;
  }

  const { start, end, prevStart, prevEnd } = monthRange();

  const [current] = await db
    .select({
      totalBookings: sql<number>`count(${bookings.id})`,
      totalRevenue: sql<number>`coalesce(sum(case when ${payments.status} = 'paid' then ${payments.amount} else 0 end), 0)`,
      newCustomers: sql<number>`count(distinct ${bookings.userId})`,
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .leftJoin(payments, eq(payments.bookingId, bookings.id))
    .where(and(eq(courts.managerId, manager.id), gte(bookings.startTime, start), lt(bookings.startTime, end)));

  const [previous] = await db
    .select({
      totalBookings: sql<number>`count(${bookings.id})`,
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(
      and(eq(courts.managerId, manager.id), gte(bookings.startTime, prevStart), lt(bookings.startTime, prevEnd))
    );

  const [topCourt] = await db
    .select({
      courtId: courts.id,
      courtName: courts.name,
      avgRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
    })
    .from(courts)
    .leftJoin(bookings, eq(bookings.courtId, courts.id))
    .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(eq(courts.managerId, manager.id))
    .groupBy(courts.id)
    .orderBy(sql`avg(${reviews.rating}) desc`)
    .limit(1);

  const weeklyRevenue = await db
    .select({
      week: sql<number>`cast(strftime('%W', ${payments.createdAt}) as integer)`,
      revenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .innerJoin(bookings, eq(bookings.id, payments.bookingId))
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(
      and(
        eq(courts.managerId, manager.id),
        eq(payments.status, "paid"),
        gte(payments.createdAt, start),
        lt(payments.createdAt, end)
      )
    )
    .groupBy(sql`strftime('%W', ${payments.createdAt})`)
    .orderBy(sql`strftime('%W', ${payments.createdAt})`);

  const utilizationRows = await db
    .select({
      hour: sql<number>`cast(strftime('%H', ${bookings.startTime}) as integer)`,
      count: sql<number>`count(*)`,
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(and(eq(courts.managerId, manager.id), gte(bookings.startTime, start), lt(bookings.startTime, end)))
    .groupBy(sql`strftime('%H', ${bookings.startTime})`)
    .orderBy(sql`strftime('%H', ${bookings.startTime})`);

  const [inventoryWarning] = await db
    .select({
      lowStock: sql<number>`coalesce(sum(case when ${inventoryItems.quantity} <= ${inventoryItems.reorderLevel} then 1 else 0 end), 0)`,
    })
    .from(inventoryItems)
    .where(eq(inventoryItems.managerId, manager.id));

  const bookingDelta =
    (current?.totalBookings ?? 0) - (previous?.totalBookings ?? 0);
  const bookingGrowthPct = (previous?.totalBookings ?? 0) > 0
    ? Number(((bookingDelta / (previous?.totalBookings ?? 1)) * 100).toFixed(1))
    : 0;

  return NextResponse.json({
    data: {
      metrics: {
        totalBookings: current?.totalBookings ?? 0,
        bookingGrowthPct,
        newCustomers: current?.newCustomers ?? 0,
        totalRevenue: current?.totalRevenue ?? 0,
        topCourt: {
          name: topCourt?.courtName ?? "-",
          rating: Number(topCourt?.avgRating ?? 0),
        },
      },
      revenueByWeek: weeklyRevenue,
      utilizationByHour: utilizationRows,
      inventory: {
        lowStockItems: inventoryWarning?.lowStock ?? 0,
      },
    },
  });
}

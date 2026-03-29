import { and, eq, gte, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, courts, users } from "@/db/schema";
import { requireManager } from "@/lib/session";

export const runtime = "nodejs";

function toDayRange(dateString?: string | null) {
  const base = dateString ? new Date(dateString) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(request: Request) {
  const manager = await requireManager(request);
  if (manager instanceof NextResponse) {
    return manager;
  }

  const { searchParams } = new URL(request.url);
  const { start, end } = toDayRange(searchParams.get("date"));

  const managerCourts = await db.query.courts.findMany({
    where: eq(courts.managerId, manager.id),
    orderBy: [courts.name],
  });

  const dayBookings = await db
    .select({
      id: bookings.id,
      courtId: bookings.courtId,
      status: bookings.status,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      playerName: users.name,
      playerEmail: users.email,
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .where(
      and(eq(courts.managerId, manager.id), gte(bookings.startTime, start), lt(bookings.startTime, end))
    )
    .orderBy(bookings.startTime);

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      confirmed: sql<number>`coalesce(sum(case when ${bookings.status} = 'confirmed' then 1 else 0 end), 0)`,
      pending: sql<number>`coalesce(sum(case when ${bookings.status} = 'pending' then 1 else 0 end), 0)`,
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(
      and(eq(courts.managerId, manager.id), gte(bookings.startTime, start), lt(bookings.startTime, end))
    );

  const totalSlots = managerCourts.length * 15;
  const occupancy = totalSlots > 0 ? Math.round(((stats?.confirmed ?? 0) / totalSlots) * 100) : 0;

  return NextResponse.json({
    data: {
      date: start.toISOString(),
      courts: managerCourts,
      bookings: dayBookings,
      stats: {
        totalBookings: stats?.total ?? 0,
        confirmedBookings: stats?.confirmed ?? 0,
        pendingBookings: stats?.pending ?? 0,
        occupancy,
      },
    },
  });
}

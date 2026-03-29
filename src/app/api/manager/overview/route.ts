import { and, desc, eq, inArray, lte, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, courts, payments, reviews, users } from "@/db/schema";
import { requireManager } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const manager = await requireManager(request);
  if (manager instanceof NextResponse) {
    return manager;
  }

  const now = new Date();

  const [financials] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      totalCommission: sql<number>`coalesce(sum(${bookings.commissionFee}), 0)`,
    })
    .from(payments)
    .innerJoin(bookings, eq(bookings.id, payments.bookingId))
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(and(eq(courts.managerId, manager.id), eq(payments.status, "paid")));

  const [upcoming] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(
      and(
        eq(courts.managerId, manager.id),
        inArray(bookings.status, ["pending", "confirmed"]),
        gte(bookings.startTime, now)
      )
    );

  const [ratings] = await db
    .select({
      averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
      totalReviews: sql<number>`count(${reviews.id})`,
    })
    .from(reviews)
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(eq(courts.managerId, manager.id));

  const recentBookings = await db
    .select({
      id: bookings.id,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      courtName: courts.name,
      playerName: users.name,
      playerEmail: users.email,
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .where(eq(courts.managerId, manager.id))
    .orderBy(desc(bookings.createdAt))
    .limit(8);

  const managerCourts = await db.query.courts.findMany({
    where: eq(courts.managerId, manager.id),
    orderBy: [courts.name],
  });

  const courtStatuses = await Promise.all(
    managerCourts.map(async (court) => {
      const activeBooking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.courtId, court.id),
          eq(bookings.status, "confirmed"),
          lte(bookings.startTime, now),
          gte(bookings.endTime, now)
        ),
      });

      return {
        id: court.id,
        name: court.name,
        location: court.location,
        occupied: Boolean(activeBooking),
      };
    })
  );

  return NextResponse.json({
    data: {
      metrics: {
        totalRevenue: financials?.totalRevenue ?? 0,
        totalCommission: financials?.totalCommission ?? 0,
        upcomingBookings: upcoming?.total ?? 0,
        averageRating: Number(ratings?.averageRating ?? 0),
        totalReviews: ratings?.totalReviews ?? 0,
      },
      recentBookings,
      courtStatuses,
    },
  });
}

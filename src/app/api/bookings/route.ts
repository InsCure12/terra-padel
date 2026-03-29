import { and, desc, eq, gt, inArray, lt, not } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { bookings, courts, payments, users } from "@/db/schema";
import { calculateBookingAmount, calculateCommissionFee } from "@/lib/commission";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const createBookingSchema = z.object({
  courtId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  paymentMethod: z.enum(["bank_transfer", "e_wallet"]),
});

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) {
    return user;
  }

  const bookingQuery = db
    .select({
      id: bookings.id,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      commissionFee: bookings.commissionFee,
      createdAt: bookings.createdAt,
      court: {
        id: courts.id,
        name: courts.name,
        location: courts.location,
        pricePerHour: courts.pricePerHour,
      },
      player: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .innerJoin(users, eq(users.id, bookings.userId));

  const rows =
    user.role === "manager"
      ? await bookingQuery.where(eq(courts.managerId, user.id)).orderBy(desc(bookings.startTime))
      : await bookingQuery.where(eq(bookings.userId, user.id)).orderBy(desc(bookings.startTime));

  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) {
    return user;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { courtId, startTime, endTime, paymentMethod } = parsed.data;
  if (endTime <= startTime) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const court = await db.query.courts.findFirst({ where: eq(courts.id, courtId) });
  if (!court) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  const overlaps = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.courtId, courtId),
        inArray(bookings.status, ["pending", "confirmed"]),
        lt(bookings.startTime, endTime),
        gt(bookings.endTime, startTime)
      )
    )
    .limit(1);

  if (overlaps.length > 0) {
    return NextResponse.json({ error: "Selected slot is unavailable" }, { status: 409 });
  }

  const amount = calculateBookingAmount(court.pricePerHour, startTime, endTime);
  const commissionFee = calculateCommissionFee(amount);

  const [createdBooking] = await db
    .insert(bookings)
    .values({
      userId: user.id,
      courtId,
      startTime,
      endTime,
      status: "pending",
      commissionFee,
    })
    .returning();

  const [createdPayment] = await db
    .insert(payments)
    .values({
      bookingId: createdBooking.id,
      amount,
      method: paymentMethod,
      status: "pending",
    })
    .returning();

  return NextResponse.json(
    {
      data: {
        booking: createdBooking,
        payment: createdPayment,
      },
    },
    { status: 201 }
  );
}

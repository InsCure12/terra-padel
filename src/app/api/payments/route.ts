import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { bookings, courts, payments } from "@/db/schema";
import { calculateBookingAmount } from "@/lib/commission";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const createPaymentSchema = z.object({
  bookingId: z.string().min(1),
  method: z.enum(["bank_transfer", "e_wallet"]),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) {
    return user;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createPaymentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await db
    .select({
      id: bookings.id,
      userId: bookings.userId,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      courtId: courts.id,
      managerId: courts.managerId,
      pricePerHour: courts.pricePerHour,
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(eq(bookings.id, parsed.data.bookingId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const canAccess = booking.userId === user.id || (user.role === "manager" && booking.managerId === user.id);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Cancelled booking cannot be paid" }, { status: 400 });
  }

  const amount = calculateBookingAmount(booking.pricePerHour, booking.startTime, booking.endTime);
  const existingPayment = await db.query.payments.findFirst({ where: eq(payments.bookingId, booking.id) });

  const payment = existingPayment
    ? (
        await db
          .update(payments)
          .set({
            method: parsed.data.method,
            amount,
            status: "pending",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, existingPayment.id))
          .returning()
      )[0]
    : (
        await db
          .insert(payments)
          .values({
            bookingId: booking.id,
            amount,
            method: parsed.data.method,
            status: "pending",
          })
          .returning()
      )[0];

  await db
    .update(bookings)
    .set({
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  return NextResponse.json({
    data: {
      payment,
      paymentLink: `/pay/${payment.id}`,
      status: "pending",
    },
  });
}

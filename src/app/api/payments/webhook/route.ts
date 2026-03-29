import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { bookings, payments } from "@/db/schema";

export const runtime = "nodejs";

const webhookSchema = z.object({
  paymentId: z.string().optional(),
  bookingId: z.string().optional(),
  status: z.enum(["paid", "failed", "refunded"]),
});

export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const incomingSecret = request.headers.get("x-webhook-secret");

  if (secret && incomingSecret !== secret) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = webhookSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const paymentRecord = parsed.data.paymentId
    ? await db.query.payments.findFirst({ where: eq(payments.id, parsed.data.paymentId) })
    : parsed.data.bookingId
      ? await db.query.payments.findFirst({ where: eq(payments.bookingId, parsed.data.bookingId) })
      : null;

  if (!paymentRecord) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const [updatedPayment] = await db
    .update(payments)
    .set({
      status: parsed.data.status,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentRecord.id))
    .returning();

  const bookingStatus = parsed.data.status === "paid" ? "confirmed" : "cancelled";
  await db
    .update(bookings)
    .set({
      status: bookingStatus,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, paymentRecord.bookingId));

  return NextResponse.json({ data: updatedPayment });
}

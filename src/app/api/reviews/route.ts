import { and, eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { bookings, reviews } from "@/db/schema";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) {
    return user;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.id, parsed.data.bookingId),
      eq(bookings.userId, user.id),
      eq(bookings.status, "confirmed"),
      lte(bookings.endTime, new Date())
    ),
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Booking not eligible for review. Must be your confirmed and completed booking." },
      { status: 400 }
    );
  }

  const existingReview = await db.query.reviews.findFirst({ where: eq(reviews.bookingId, booking.id) });
  if (existingReview) {
    return NextResponse.json({ error: "Review already exists for this booking" }, { status: 409 });
  }

  const [review] = await db
    .insert(reviews)
    .values({
      bookingId: booking.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    })
    .returning();

  return NextResponse.json({ data: review }, { status: 201 });
}

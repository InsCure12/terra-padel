import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { courts, reviews, bookings } from "@/db/schema";
import { requireManager } from "@/lib/session";

export const runtime = "nodejs";

const createCourtSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(3),
  pricePerHour: z.number().int().positive(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location");

  const rows = await db
    .select({
      id: courts.id,
      name: courts.name,
      location: courts.location,
      pricePerHour: courts.pricePerHour,
      managerId: courts.managerId,
      averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
      totalReviews: sql<number>`count(${reviews.id})`,
    })
    .from(courts)
    .leftJoin(bookings, eq(bookings.courtId, courts.id))
    .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(location ? ilike(courts.location, `%${location}%`) : undefined)
    .groupBy(courts.id)
    .orderBy(desc(courts.createdAt));

  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const user = await requireManager(request);
  if (user instanceof NextResponse) {
    return user;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createCourtSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [createdCourt] = await db
    .insert(courts)
    .values({
      name: parsed.data.name,
      location: parsed.data.location,
      pricePerHour: parsed.data.pricePerHour,
      managerId: user.id,
    })
    .returning();

  return NextResponse.json({ data: createdCourt }, { status: 201 });
}

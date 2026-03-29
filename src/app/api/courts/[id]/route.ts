import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, courts, reviews, users } from "@/db/schema";

export const runtime = "nodejs";

function dayRange(dateString?: string | null) {
  const base = dateString ? new Date(dateString) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

const galleryImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCZoVEvEw8Qx9YB0l3TMjTJe8H_aVkzfgSF1UHXt2eDUDk-pMcRXW_72MMc_bb1W_DBjhpYUX5LWR05hcVqccuYzVCfqVW8oY1U8PcclJhkqxzrIDb6gdwp67kc7c493wTpYiigby_1cqaxp5TDSwqLjm9zouTzHdwLpJfvLs3n7GCRTqg2-CM5RJGn8_v4VqigKax-GhxZi6KYR4WVANeKrzJsdCyKKKGUwUsaCq0YwNHQ4eYWvm4iB3kLmy08etxT-Yoe07hmyt0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAezrBrnbFo-5TirSpEBxVTxTzPadA6S9eBLU0uJ9_YZdMiHk_X7fnrxczJbA5h-rfCHUryy1lCQfVMF6OrYTnC0sX4TVjSUreQGlRmCQNNOnooZtASYHeTh34uVB7VTvTMdg6en1FwOX9R3LHOnULLfpHe4gIdfbosEMB1S-c9n9oAUVwUv7nFePt5YcJ8nY4M74GKcPMIRi5ULFPeiM_Q5CEHOU1K4z2I9Y63GFNqYarJwdRgRi7_QSEXXVlRxvwC1AYHJzX4fok",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBUdPxKMZt_xyGLsniozvjDDPkMkaP4FiUJhehdt823_XNJJA507weBnSu-NPqfeG5wx946k6rbMZj4tcQaZ7tI9yzpIUjB63mIRb4LWCBPoJ6dWVnyfrS9EwjrtIzZn7G-zaGHYUS06DBTj2MOVlXZlXlmOpxjsqCwHvQJ4jFFF0J4BqdDNZBwbID5v53WW3oWkM1SryG850sCffGRPa2jXftKHZ-n4o5NeMgI0u2dwNgsCJ8l8uenw3SC9_gKC7XlKOF8utnuPz8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDwGSB9gTYjDD7zB0hqOpBVNqzJ5OBwv4w9vlYMzAuaqC4lPawaxhwzuNwig7tz_o4XNqmEnxpv2BM2J1lFRh_QsDaednhESpjLD6SIUfEjzo4uQmUIJj5nGbxSFO21Q6S5ySPI_Ql_UdLXqTLSrWXbcsOL2MUiIHUawyLGW4wcgfvB2VWXl-509ekPiwzZA-1lYOmvPyhQWP11wwoCdSA8DU3zdQI_eOHCAM3lopv8oZkRnaDfmbYJxMQGi13fRm1Fq4sgn2bbugU",
];

const amenities = [
  { title: "Equipment Rental", subtitle: "Professional rackets and balls available", icon: "sports_tennis" },
  { title: "Changing Rooms", subtitle: "Secure lockers and private stalls", icon: "checkroom" },
  { title: "Premium Showers", subtitle: "Complimentary towels and toiletries", icon: "shower" },
  { title: "On-site Cafe", subtitle: "Organic juices and artisan snacks", icon: "coffee" },
];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const { start, end } = dayRange(searchParams.get("date"));

  const [court] = await db
    .select({
      id: courts.id,
      name: courts.name,
      location: courts.location,
      pricePerHour: courts.pricePerHour,
      averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
      totalReviews: sql<number>`count(${reviews.id})`,
    })
    .from(courts)
    .leftJoin(bookings, eq(bookings.courtId, courts.id))
    .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(eq(courts.id, id))
    .groupBy(courts.id)
    .limit(1);

  if (!court) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  const dayBookings = await db
    .select({
      id: bookings.id,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.courtId, id),
        inArray(bookings.status, ["pending", "confirmed"]),
        gte(bookings.startTime, start),
        lt(bookings.startTime, end)
      )
    )
    .orderBy(bookings.startTime);

  const latestReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      playerName: users.name,
    })
    .from(reviews)
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .where(eq(bookings.courtId, id))
    .orderBy(desc(reviews.createdAt))
    .limit(6);

  return NextResponse.json({
    data: {
      court,
      amenities,
      galleryImages,
      bookings: dayBookings,
      reviews: latestReviews,
    },
  });
}

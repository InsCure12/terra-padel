import { and, gte, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, courts } from "@/db/schema";

export const runtime = "nodejs";

function monthRange(base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end };
}

const featuredEvent = {
  id: "autumn-open",
  type: "Major Tournament",
  title: "Terra Autumn Open",
  description:
    "Our biggest seasonal tournament. Compete across three divisions for the trophy and community prestige.",
  dateLabel: "Oct 24 - 26",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCvqaDkz7ky-_baLWQmA-ZgbVCSUUfmum9-ALsGs-xoMvgjPUOzvL3KNBRHLNa6CwM3EkpOWi_-bAOL8vImGqMmpsJ0FavTZ5bRGwWs6p8flhBIFbZ0JOd1qYGBoYsnljQQaB7Qf0xdI3ZHlYad_qSCgFgHckMmhPbeRwNCleyOalbQajsrAVqQDNMq7Ka2DulKOTf-hwOOwt_4MI1yaV8Dr04JYdZWTdhqViKKY8Xwo6VUyMa9Kjyq0jNmYW5zFhp-GZWkGJYLskM",
};

const communityHighlights = [
  { id: "h1", title: "Weekly Beginner Mixers", subtitle: "Every Tuesday at 6 PM" },
  { id: "h2", title: "Ladies & Lavender Tea", subtitle: "Social play and local botanicals" },
  { id: "h3", title: "Exhibition Matches", subtitle: "Watch the pros play every Friday" },
];

const upcomingEvents = [
  {
    id: "mixer-oct-12",
    title: "Saturday Morning Mixer",
    month: "Oct",
    day: "12",
    time: "09:00 AM - 11:30 AM",
    level: "Beginner & Intermediate",
    fee: "$15.00 / person",
    cta: "Register Now",
    category: "Socials",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAg3MSPh-unYpowWt4HI5yciIGLBFNBTU0p4MSkS2hQlpistR_sC0z8ID9c8WexlGL14Dnnt1zUzArGi87Cdnj3gqFi9HzysdCWnug1ThchdgMzmRwvMEGIGpNuWQ0Knq1FEES1EaXznwbC7bA-awh0DIKIIuFEId2n1KiodQbedsCAlh1Z4U55FI1M_4XaNTRBzdSluxFMhi5m3fvwuE81-5hgnBOZ5Fh1NPwAYVLkwXcQpSEKLLvnEPSZd-nnNIzGS5Hma2KvKDU",
  },
  {
    id: "pro-exhibition-oct-15",
    title: "Pro Exhibition Match",
    month: "Oct",
    day: "15",
    time: "07:00 PM - 09:00 PM",
    level: "Spectators Only",
    fee: "Free Entry",
    cta: "RSVP for Attendance",
    category: "Showcase",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDJXHds4bbFnnj7hbb0gQRWK74HQC1q5_A2Tx3qpyzTCmQ3TguM8XhsN_zJI6iZiJVM7MsUDkfKmEPZPPuevdvXMs_deyXNhZf64zTLMfI_xgLypaxFlKoKvcEeIbm23Ek4zXRqZ9S8YfltX3uY8OuJm9G_m23cODDmhYGpDRDloG2hmQPNnHCXvCvOB4rPOHeaHjjnbnL6YIRhRbQgobQEDlc5Nyu7WUOKz6zQEIQjK2xuQWSVLZk1MU8IMaaV2glG0JKSJ5LV8F4",
  },
  {
    id: "mens-ladder-oct-20",
    title: "Men's Ladder Play",
    month: "Oct",
    day: "20",
    time: "06:00 PM - 08:30 PM",
    level: "Advanced (4.0+)",
    fee: "$25.00 / team",
    cta: "Register Now",
    category: "Tournaments",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDEc5-xxSpB6AgSbRfSgAvw5jx_hTnArg6As0BHWlzY8I-5j_BMyAl0GbsFjVe-e2DPHBbiaB0r7esgwb1mSBZWz9-pQVMTtB1ORNQH_XN2X94gG-Zsb7ftGOw_t7Nh4QK6CS1QP3xjtizWWIaR5W1RCJMu6osDzPt7LeaLIfEC9BzFrk_E4NYMm-OQDuxEMhq_9HUh-tL-hFhU8hnh61cavF4oT97SrSHPlrvb9vqD0NOGYP8H9wG8HMG6w_pv49qcF-RvlaaVhC0",
  },
];

const hostFeatures = [
  "Custom Catering",
  "Dedicated Coordinator",
  "Racket Rentals",
  "Digital Scoring",
];

export async function GET() {
  const { start, end } = monthRange();

  const [courtTotals] = await db
    .select({
      totalCourts: sql<number>`count(${courts.id})`,
    })
    .from(courts);

  const [bookingTotals] = await db
    .select({
      monthlyBookings: sql<number>`count(${bookings.id})`,
    })
    .from(bookings)
    .where(and(gte(bookings.startTime, start), lt(bookings.startTime, end)));

  return NextResponse.json({
    data: {
      stats: {
        totalCourts: courtTotals?.totalCourts ?? 0,
        monthlyBookings: bookingTotals?.monthlyBookings ?? 0,
      },
      featuredEvent,
      communityHighlights,
      upcomingEvents,
      hostFeatures,
    },
  });
}

import { gte, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, courts, users } from "@/db/schema";

export const runtime = "nodejs";

const coaches = [
  {
    id: "coach-mateo",
    name: "Mateo Silva",
    headline: "Mastering the Bandeja",
    priceLabel: "$75/hr",
    rating: 4.9,
    bio: "Pro player with 10 years experience. Specialist in overhead technique and defensive positioning.",
    levels: ["Intermediate", "Pro"],
    sessionType: "Private Lessons",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDjGSRnRx9rsBcY11JprXiXAf6EW2zQjLE8Xc2WwLNNdr13DwWK483ctOrdGyvO5DTI8XSJd6wAlO0Lj0oVA3bsa3QG87xscetY1Fe8SvUDA78pGaVrqajpYeY8q6AKGS_Z7OX-DTEOjamqvu2xcak0jIaF7hl-ySxg0mHwWlJnwOcYvIJcg3jSzMzgHAq1qHMlRR_A8yD0cWxmBVkspbxIxScp0m_XDuz_wCyXsEcBzA4_GVPX1OG5WyePjF0TF1v85reTYIP_Y1w",
  },
  {
    id: "coach-elena",
    name: "Elena Rodriguez",
    headline: "Beginner Basics",
    priceLabel: "$60/hr",
    rating: 5,
    bio: "Patient and encouraging. Focused on fundamental grip, stance, and court awareness for new players.",
    levels: ["Beginner"],
    sessionType: "Private Lessons",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCiUz7ORP68ZyOySoYn-SlXkb6WWM72L-SBtOGoDHV3Do379WR1bFY8xgV1X1045h7x_sNS320vzq5QsC4buEOfcXacm3W_rSOVov7QxHu6bzC76VSAgwjtXbbiFj_Kc3OeMDWfLlNMKttTcTR2eA8x9_-t_iQPT4VjlIO-J8xkPClfPyFsMyJrQwfMnrqg-cg3aRalnP4A7tzuO38tEdOcXOCrp6BE-tBq2pjUzaZMWgphpD7mhWD0B4nP--8WbqK-ZkhYd5rAAcQ",
  },
  {
    id: "coach-julian",
    name: "Julian Vance",
    headline: "Tactical Clinic",
    priceLabel: "$85/hr",
    rating: 4.8,
    bio: "Strategic mastermind. Learn how to control the net and force errors through high-percentage play.",
    levels: ["Intermediate", "Pro"],
    sessionType: "Clinics & Workshops",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBFqENSbqELqW18hWiPVkYqr7UfvfJD8z5vutWrmwxTBUBZZ3HP0auUjFLIW76SuVqUcqrF8ebRuXpO08Wimgyhaj7Fe9E8tIdWnYtA__i-HikekEx3RdBaE13kHUbvMwIyJ8P_rTJj-9NmQtYd5Tsdvfs3hZ-ACt4LMcf1WbRjJaYSIvApeDHSA_xRcWkAyLcESYrGVO9C25-evFJF8ge_DyD50Tn2KwirDqChEiZxhRc4XkZgJfLp1H9kVEO2so6xHKgMMb0c00k",
  },
  {
    id: "coach-sarah",
    name: "Sarah Chen",
    headline: "Group Dynamics",
    priceLabel: "$40/hr/pp",
    rating: 4.9,
    bio: "Specialist in group training and social play. Perfect for friends wanting to improve together.",
    levels: ["Beginner", "Intermediate"],
    sessionType: "Group Sessions",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOwvE1cKr3VQDDReIfaLSe8tnXY5muh0lIZb4zimkrvrGk_Um7xi8SHm9_Lr-H5EDfA2Ip-9oXsP8pjfA5wtfZ-izKj9SMD6NWWh3TQkqRv_C7DktFDhu1kUSzj4zIxcwuF6tFYEnTQSJSBqPsy3IdiPQIipNlTYjSvt3eLRwZ10JPhy3OEDhOg_cnCv8IlYWPTPSa95PqfS-nKXrWQMlHOrw00zVYgSR3SFIDGbYSPYVTO0RzG0AHwwmkMffODAUBBGkLscot2gg",
  },
];

export async function GET() {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

  const [courtStats] = await db.select({ totalCourts: sql<number>`count(${courts.id})` }).from(courts);
  const [playerStats] = await db
    .select({ totalPlayers: sql<number>`count(${users.id})` })
    .from(users)
    .where(sql`${users.role} = 'player'`);
  const [bookingStats] = await db
    .select({ total: sql<number>`count(${bookings.id})` })
    .from(bookings)
    .where(sql`${bookings.startTime} >= ${start} and ${bookings.startTime} < ${end}`);

  return NextResponse.json({
    data: {
      stats: {
        activeCourts: courtStats?.totalCourts ?? 0,
        totalPlayers: playerStats?.totalPlayers ?? 0,
        monthlyBookings: bookingStats?.total ?? 0,
      },
      coaches,
      assessment: {
        title: "Not sure where to start?",
        description:
          "Schedule a 15-minute complimentary level assessment with our Head of Coaching. We'll help you find the right path and the perfect coach for your journey.",
      },
    },
  });
}

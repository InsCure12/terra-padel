import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export const runtime = "nodejs";

const plans = [
  {
    id: "seed",
    name: "Seed",
    subtitle: "The beginning of your journey",
    icon: "potted_plant",
    price: 29,
    accent: "primary",
    cta: "Plant the Seed",
    featured: false,
    benefits: [
      "10% discount on court bookings",
      "Access to community mixers",
      "Monthly newsletter access",
    ],
  },
  {
    id: "sprout",
    name: "Sprout",
    subtitle: "For the regular player",
    icon: "eco",
    price: 79,
    accent: "primary",
    cta: "Start Growing",
    featured: true,
    benefits: [
      "25% discount on court bookings",
      "48-hour early booking window",
      "2 guest passes per month",
      "Discounted lesson rates",
    ],
  },
  {
    id: "ancient-oak",
    name: "Ancient Oak",
    subtitle: "The ultimate padel experience",
    icon: "park",
    price: 149,
    accent: "tertiary",
    cta: "Become an Oak",
    featured: false,
    benefits: [
      "50% discount on court bookings",
      "7-day early booking window",
      "Free racket & ball rentals",
      "Locker room & Sauna access",
      "Unlimited guest passes",
    ],
  },
];

const comparisonRows = [
  { feature: "Court Discounts", seed: "10%", sprout: "25%", oak: "50%" },
  { feature: "Early Booking Access", seed: "24 hours", sprout: "48 hours", oak: "7 days" },
  { feature: "Equipment Rentals", seed: "No", sprout: "Discounted", oak: "Free" },
  { feature: "Guest Passes", seed: "-", sprout: "2 / month", oak: "Unlimited" },
  { feature: "Terra Lounge Access", seed: "No", sprout: "Yes", oak: "Yes" },
];

export async function GET() {
  const [members] = await db
    .select({ totalMembers: sql<number>`count(${users.id})` })
    .from(users)
    .where(sql`${users.role} = 'player'`);

  return NextResponse.json({
    data: {
      stats: {
        totalMembers: members?.totalMembers ?? 0,
      },
      plans,
      comparisonRows,
      gallery: {
        main:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuA7EpHBe51fxh-GL46skBtg8ojGJu2fbrHC0oClVVhKSVBWybTVcp5MTtFBwgrmtUO1uDe8iXuBo-BWi6ksVbCuVkmcjVln-DoTLjkn6c4DkbB4PRAM4DeLlQVFR14c8FKGuXvKcpI1EIIy7_iKukNSInNWNiOI8fuXhKfFJ0TeeE8KnZHWYQMbxuMct1LZC5nAwOJkPKyK2q82uJvO2LimD6C1QJojbB_ZSmUq-CcUbAtWwtrQIbWc_vymIhgyabYzbO3Ot0olX3o",
        gym:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC-BReRcIjqHldXFyAOVLc5efHEqleQfhzCMnDStE7RNJBFmPPPcvBMv2aefmP8OJRtKoc2jwJokWuB0Kqc6ab_cTlZo2U8T0jhnNviVgQsx26fPKuLw23XylH6JG65ifHGpugTcM0WcijNBlF9N-6NxXg72kgSinPQkPqsh1YRnzHy2_9At9OqKOEQnyR-coo7OHz4SlfBtrsA-551PP3Dimc7zCGS_TsgAfkCmjTI-rRjVeKCeo1pGSeSiGgKX6iL4Tkeey3TBPg",
        yoga:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDCLcKyrb8iDKbTBUuPABSVtQ8usIw1zDdbQ38mxPmLlWO_qJLpI7XduGPbSTAm3O2wV1E4OIAhE6M_KdZWtk-30qW1kKi_bIrQHhsDmxmIjs9jIoAqpAsqxkanbgk7zA2iP9EczdMxY7B8Ra1XTYSewHmUlrmZVoU_O_njW8f4uMiTBAITdr5X2xnPgoWbDIr7r4C4KkgC8sCeD2OYf33HYN7FNGRATPZd_BgoMwzfY2fWRTIoijNUwVOopELHd7uMn7diUYGNx5Q",
        lounge:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCji4mvGCNipM_zn1JV52FDI1d1c8eXMQXn_RBujmoYjbzb6HqMrhC2IzTvdsEIMHd8etjN08paoy1SFuqICBdLfAapG7OeCqx33RNiqTuh9MjK_ayxJocvANA4CECOKff6iOwaJm3kCerAT6OkzmtoiKFuhTlbJ8c6Yd-9-wAQ_R5sda_7-eZnKh4uTul1LzuDszKf9245vs6nliS3lxsq-J9hSnvEIxOt8zdAQA9Ja5iqq4VVARnmAC2YDWQjD7Ve3K2hniKcQ98",
      },
    },
  });
}

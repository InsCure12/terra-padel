import { calculateBookingAmount, calculateCommissionFee } from "@/lib/commission";
import { db, sqlite } from "@/db";
import { bookings, courts, inventoryItems, payments, reviews, users } from "@/db/schema";

const managerId = "seed-manager-1";
const playerAId = "seed-player-1";
const playerBId = "seed-player-2";

const courtSeeds = [
  {
    id: "seed-court-1",
    name: "Court 01",
    location: "Indoor Standard Hall",
    pricePerHour: 250000,
    managerId,
  },
  {
    id: "seed-court-2",
    name: "Court 02",
    location: "Indoor Standard Hall",
    pricePerHour: 250000,
    managerId,
  },
  {
    id: "seed-court-3",
    name: "Court 03",
    location: "Outdoor Terrace",
    pricePerHour: 220000,
    managerId,
  },
  {
    id: "seed-court-4",
    name: "Court 04",
    location: "Premium Panoramic",
    pricePerHour: 320000,
    managerId,
  },
];

function atToday(hour: number, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function atTomorrow(hour: number, minute = 0) {
  const date = atToday(hour, minute);
  date.setDate(date.getDate() + 1);
  return date;
}

const bookingSeeds = [
  {
    id: "seed-booking-1",
    userId: playerAId,
    courtId: "seed-court-1",
    startTime: atToday(9, 0),
    endTime: atToday(10, 30),
    status: "confirmed" as const,
  },
  {
    id: "seed-booking-2",
    userId: playerBId,
    courtId: "seed-court-2",
    startTime: atToday(11, 0),
    endTime: atToday(12, 30),
    status: "pending" as const,
  },
  {
    id: "seed-booking-3",
    userId: playerAId,
    courtId: "seed-court-4",
    startTime: atTomorrow(19, 0),
    endTime: atTomorrow(20, 30),
    status: "confirmed" as const,
  },
  {
    id: "seed-booking-4",
    userId: playerBId,
    courtId: "seed-court-3",
    startTime: atToday(7, 30),
    endTime: atToday(9, 0),
    status: "cancelled" as const,
  },
];

const inventorySeeds = [
  {
    id: "seed-inventory-1",
    managerId,
    name: "Bullpadel Vertex 04",
    sku: "RACK-VTX-04",
    category: "Rackets",
    quantity: 12,
    rentedCount: 5,
    unitPrice: 210000,
    reorderLevel: 4,
  },
  {
    id: "seed-inventory-2",
    managerId,
    name: "Head Pro S+ Balls",
    sku: "BALL-HPS-01",
    category: "Balls",
    quantity: 24,
    rentedCount: 8,
    unitPrice: 110000,
    reorderLevel: 10,
  },
  {
    id: "seed-inventory-3",
    managerId,
    name: "Nike Court Vapor Shoes",
    sku: "SHOE-NCV-09",
    category: "Shoes",
    quantity: 3,
    rentedCount: 2,
    unitPrice: 450000,
    reorderLevel: 5,
  },
  {
    id: "seed-inventory-4",
    managerId,
    name: "Cooling Towel",
    sku: "ACC-TWL-01",
    category: "Accessories",
    quantity: 18,
    rentedCount: 4,
    unitPrice: 35000,
    reorderLevel: 6,
  },
];

async function main() {
  await db
    .insert(users)
    .values([
      {
        id: managerId,
        name: "Alex Rivera",
        email: "manager@terra.local",
        emailVerified: true,
        role: "manager",
      },
      {
        id: playerAId,
        name: "Julianne Davis",
        email: "julianne@terra.local",
        emailVerified: true,
        role: "player",
      },
      {
        id: playerBId,
        name: "Marcus Brooks",
        email: "marcus@terra.local",
        emailVerified: true,
        role: "player",
      },
    ])
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        role: users.role,
        updatedAt: new Date(),
      },
    });

  await db.insert(courts).values(courtSeeds).onConflictDoUpdate({
    target: courts.id,
    set: {
      name: courts.name,
      location: courts.location,
      pricePerHour: courts.pricePerHour,
      managerId: courts.managerId,
      updatedAt: new Date(),
    },
  });

  const bookingRows = bookingSeeds.map((booking) => {
    const court = courtSeeds.find((entry) => entry.id === booking.courtId);
    const amount = calculateBookingAmount(court?.pricePerHour ?? 0, booking.startTime, booking.endTime);
    return {
      ...booking,
      commissionFee: calculateCommissionFee(amount),
    };
  });

  await db.insert(bookings).values(bookingRows).onConflictDoUpdate({
    target: bookings.id,
    set: {
      userId: bookings.userId,
      courtId: bookings.courtId,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      commissionFee: bookings.commissionFee,
      updatedAt: new Date(),
    },
  });

  const paymentRows = bookingRows.map((booking) => {
    const court = courtSeeds.find((entry) => entry.id === booking.courtId);
    const amount = calculateBookingAmount(court?.pricePerHour ?? 0, booking.startTime, booking.endTime);

    return {
      id: `seed-payment-${booking.id}`,
      bookingId: booking.id,
      amount,
      method: booking.id === "seed-booking-2" ? ("e_wallet" as const) : ("bank_transfer" as const),
      status:
        booking.status === "confirmed"
          ? ("paid" as const)
          : booking.status === "pending"
            ? ("pending" as const)
            : ("failed" as const),
    };
  });

  await db.insert(payments).values(paymentRows).onConflictDoUpdate({
    target: payments.id,
    set: {
      bookingId: payments.bookingId,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      updatedAt: new Date(),
    },
  });

  await db
    .insert(reviews)
    .values([
      {
        id: "seed-review-1",
        bookingId: "seed-booking-1",
        rating: 5,
        comment: "Great indoor court and friendly staff.",
      },
      {
        id: "seed-review-2",
        bookingId: "seed-booking-3",
        rating: 4,
        comment: "Excellent panoramic view and good lighting.",
      },
    ])
    .onConflictDoUpdate({
      target: reviews.id,
      set: {
        bookingId: reviews.bookingId,
        rating: reviews.rating,
        comment: reviews.comment,
        updatedAt: new Date(),
      },
    });

  await db.insert(inventoryItems).values(inventorySeeds).onConflictDoUpdate({
    target: inventoryItems.id,
    set: {
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      category: inventoryItems.category,
      quantity: inventoryItems.quantity,
      rentedCount: inventoryItems.rentedCount,
      unitPrice: inventoryItems.unitPrice,
      reorderLevel: inventoryItems.reorderLevel,
      updatedAt: new Date(),
    },
  });

  console.log("Seed completed successfully.");
  console.log("Manager:", "manager@terra.local");
  console.log("Players:", "julianne@terra.local", "marcus@terra.local");
  console.log("Courts:", courtSeeds.length);
  console.log("Bookings:", bookingRows.length);
  console.log("Inventory items:", inventorySeeds.length);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    sqlite.close();
  });
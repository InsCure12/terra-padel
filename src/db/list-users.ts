import { db } from "@/db";
import { users } from "@/db/schema";

async function main() {
  const allUsers = await db.select().from(users);

  console.log("\n📋 All Users:");
  console.log("----------------------------------------");
  allUsers.forEach((user) => {
    console.log(`${user.name}\n  Email: ${user.email}\n  Role: ${user.role}\n`);
  });
  console.log("----------------------------------------");
}

main();

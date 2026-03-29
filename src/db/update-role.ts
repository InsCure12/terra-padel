import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const username = process.argv[2];
  const newRole = process.argv[3];

  if (!username || !newRole) {
    console.error("Usage: tsx src/db/update-role.ts <email|name> <role>");
    process.exit(1);
  }

  if (!["manager", "player"].includes(newRole)) {
    console.error("Role must be 'manager' or 'player'");
    process.exit(1);
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, username))
      .limit(1);

    if (!user || user.length === 0) {
      console.error(`User not found: ${username}`);
      process.exit(1);
    }

    await db.update(users).set({ role: newRole as "manager" | "player" }).where(eq(users.email, username));

    console.log(`✓ Updated ${user[0].name} (${user[0].email}) → role: ${newRole}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();

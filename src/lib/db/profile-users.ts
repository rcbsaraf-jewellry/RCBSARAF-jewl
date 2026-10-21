import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";

const ORG = "org_rcb";

export async function ensureProfileUsers(db: {
  // Drizzle database instance used only to upsert demo profile users.
  select: Function;
  insert: Function;
}) {
  const passwordHash = bcrypt.hashSync("Sarafa@123", 10);
  const extras = [
    { id: "user_sales", name: "Arjun Kapoor", email: "sales@rcbsarafa.com", role: "sales" },
    { id: "user_billing", name: "Kavya Mehta", email: "billing@rcbsarafa.com", role: "billing" },
    { id: "user_store", name: "Rohan Joshi", email: "store@rcbsarafa.com", role: "store_manager" },
    { id: "user_owner", name: "Sahil Mehta", email: "owner@rcbsarafa.com", role: "business_owner" },
  ];
  for (const u of extras) {
    const existing = (await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1)) as Array<{
      id: string;
    }>;
    if (existing.length) continue;
    await db.insert(users).values({ ...u, organizationId: ORG, passwordHash });
  }
}

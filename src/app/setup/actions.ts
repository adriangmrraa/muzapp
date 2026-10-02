"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const setupSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(255),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

export type SetupState = { error: string };

/**
 * First-access bootstrap: creates the first admin account — only while the
 * users table is empty. The advisory lock serializes concurrent submissions so
 * two simultaneous first-access requests cannot both create an admin.
 */
export async function createFirstAdmin(
  _prevState: SetupState,
  formData: FormData
): Promise<SetupState> {
  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const email = parsed.data.email.toLowerCase();
  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  let created = false;
  await db.transaction(async (tx) => {
    // Serialize first-access attempts across instances/requests.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(727001)`);
    const { rows } = await tx.execute<{ count: number }>(
      sql`SELECT count(*)::int AS count FROM users`
    );
    if ((rows[0]?.count ?? 0) > 0) return;

    await tx.insert(users).values({
      email,
      hashedPassword,
      name: parsed.data.name,
      role: "admin",
    });
    created = true;
  });

  if (!created) {
    return { error: "La configuración inicial ya fue realizada." };
  }

  redirect("/login");
}

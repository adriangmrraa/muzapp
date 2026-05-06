"use server";

import { signIn } from "@/auth";
import { loginSchema } from "@/lib/validations/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function signInAction(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Email o contraseña inválidos." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Credenciales incorrectas. Verificá tu email y contraseña." };
    }
    throw err;
  }

  redirect("/admin");
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginShell from "./login-shell";

export const metadata = {
  title: "Iniciar sesión — Mrs Muzzarella Admin",
};

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/admin");
  }

  return <LoginShell />;
}

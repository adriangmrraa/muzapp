import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./login-form";

export const metadata = {
  title: "Iniciar sesión — Mrs Muzzarella Admin",
};

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-gold-gradient">
            Mrs Muzzarella
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Panel de administración</p>
        </div>

        {/* Glass card */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Iniciar sesión</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

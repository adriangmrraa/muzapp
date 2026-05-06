import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminSidebar from "@/components/admin/sidebar";
import AdminTopbar from "@/components/admin/topbar";
import PageTransition from "@/components/admin/page-transition";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#0a0a0a]"
    >
      {/* Sidebar desktop */}
      <AdminSidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar user={session.user} />
        <PageTransition>{children}</PageTransition>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}

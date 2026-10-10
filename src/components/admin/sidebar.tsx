import AdminSidebarContent from "./sidebar-content";

export default function AdminSidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <AdminSidebarContent showFooter />
    </aside>
  );
}

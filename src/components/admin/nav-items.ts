import {
  LayoutDashboardIcon,
  PackageIcon,
  BotIcon,
  MessageSquareIcon,
  UsersIcon,
  BarChart2Icon,
} from "lucide-react";

export const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboardIcon,
    disabled: false,
  },
  {
    label: "Productos",
    href: "/admin/products",
    icon: PackageIcon,
    disabled: false,
  },
  {
    label: "Agente IA",
    href: "/admin/agent",
    icon: BotIcon,
    disabled: false,
  },
  {
    label: "Conversaciones",
    href: "/admin/conversations",
    icon: MessageSquareIcon,
    disabled: false,
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: UsersIcon,
    disabled: false,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart2Icon,
    disabled: false,
  },
];

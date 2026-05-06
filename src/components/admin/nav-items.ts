import {
  LayoutDashboardIcon,
  PackageIcon,
  BotIcon,
  MessageSquareIcon,
  UsersIcon,
  UserRoundIcon,
  BarChart2Icon,
  MegaphoneIcon,
  UtensilsCrossedIcon,
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
    label: "Pedidos / Cocina",
    href: "/admin/orders",
    icon: UtensilsCrossedIcon,
    disabled: false,
  },
  {
    label: "Agente IA",
    href: "/admin/agent",
    icon: BotIcon,
    disabled: false,
  },
  {
    label: "Meta Ads",
    href: "/admin/meta",
    icon: MegaphoneIcon,
    disabled: false,
  },
  {
    label: "Conversaciones",
    href: "/admin/conversations",
    icon: MessageSquareIcon,
    disabled: false,
  },
  {
    label: "Clientes",
    href: "/admin/clients",
    icon: UserRoundIcon,
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

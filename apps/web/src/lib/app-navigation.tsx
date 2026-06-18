import type { LucideIcon } from "lucide-react";
import {
  Bot,
  CreditCard,
  Gauge,
  Layers3,
  LifeBuoy,
  Lock,
  MessageSquareText,
  PlusCircle,
  Receipt,
  Settings,
  Shield,
  Sparkles,
  Users,
  Workflow,
  Building2,
  FolderKanban,
  UserCog
} from "lucide-react";

export type AppNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  requiresSuperAdmin?: boolean;
  hideForSuperAdmin?: boolean;
  children?: AppNavItem[];
};

export const appNavigation: AppNavItem[] = [
  {
    title: "Dashboard",
    href: "/app/dashboard",
    icon: Gauge,
    description: "Visão executiva"
  },
  {
    title: "Comunidades",
    href: "/app/communities",
    icon: Layers3,
    description: "Operação das comunidades",
    children: [
      { title: "Todas as comunidades", href: "/app/communities", icon: Layers3 },
      { title: "Nova comunidade", href: "/app/communities/new", icon: PlusCircle }
    ]
  },
  {
    title: "Telegram",
    href: "/app/telegram/connect",
    icon: Bot,
    description: "Conexão e operação do bot",
    children: [
      { title: "Conectar bot", href: "/app/telegram/connect", icon: Bot },
      { title: "Grupos conectados", href: "/app/telegram/groups", icon: FolderKanban },
      { title: "Logs do bot", href: "/app/telegram/logs", icon: MessageSquareText }
    ]
  },
  {
    title: "Automações",
    href: "/app/automations/welcome",
    icon: Workflow,
    description: "Mensagens e regras",
    children: [
      { title: "Boas-vindas", href: "/app/automations/welcome", icon: Sparkles },
      { title: "Aprovação automática", href: "/app/automations/approval", icon: Shield },
      { title: "Mensagens automáticas", href: "/app/automations/messages", icon: MessageSquareText }
    ]
  },
  {
    title: "Membros",
    href: "/app/members/list",
    icon: Users,
    description: "Base e retenção",
    children: [
      { title: "Lista de membros", href: "/app/members/list", icon: Users },
      { title: "Estatísticas", href: "/app/members/stats", icon: Gauge }
    ]
  },
  {
    title: "Assinatura",
    href: "/app/subscription",
    icon: CreditCard,
    description: "Plano e pagamentos",
    hideForSuperAdmin: true,
    children: [
      { title: "Meu plano", href: "/app/subscription", icon: CreditCard, hideForSuperAdmin: true },
      { title: "Histórico de pagamentos", href: "/app/subscription/history", icon: Receipt, hideForSuperAdmin: true }
    ]
  },
  {
    title: "Admin",
    href: "/app/admin/dashboard",
    icon: UserCog,
    description: "Gestão global da plataforma",
    requiresSuperAdmin: true,
    children: [
      {
        title: "Visão da plataforma",
        href: "/app/admin/dashboard",
        icon: Gauge,
        requiresSuperAdmin: true
      },
      { title: "Planos SaaS", href: "/app/admin/plans", icon: CreditCard, requiresSuperAdmin: true },
      { title: "Usuários", href: "/app/admin/users", icon: Users, requiresSuperAdmin: true },
      { title: "Organizações", href: "/app/admin/organizations", icon: Building2, requiresSuperAdmin: true }
    ]
  },
  {
    title: "Configurações",
    href: "/app/settings/profile",
    icon: Settings,
    description: "Perfil e preferências",
    children: [
      { title: "Perfil", href: "/app/settings/profile", icon: Settings },
      { title: "Segurança", href: "/app/settings/security", icon: Lock },
      { title: "Preferências", href: "/app/settings/preferences", icon: LifeBuoy }
    ]
  }
];

export function getVisibleNavigation(isSuperAdmin: boolean) {
  const baseItems = appNavigation
    .filter((item) => !item.requiresSuperAdmin || isSuperAdmin)
    .filter((item) => !(isSuperAdmin && item.hideForSuperAdmin))
    .map((item) => ({
      ...item,
      children: item.children
        ?.filter((child) => !child.requiresSuperAdmin || isSuperAdmin)
        .filter((child) => !(isSuperAdmin && child.hideForSuperAdmin))
    }));

  if (!isSuperAdmin) {
    return baseItems;
  }

  const adminSection = baseItems.find((item) => item.title === "Admin");
  const rest = baseItems.filter((item) => item.title !== "Admin");

  return adminSection ? [rest[0], adminSection, ...rest.slice(1)] : baseItems;
}

export function flattenNavigation(items: AppNavItem[]): AppNavItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenNavigation(item.children) : [])]);
}

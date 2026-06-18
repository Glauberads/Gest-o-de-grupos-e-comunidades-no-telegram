import { Bot, Link2, ShieldCheck, Users } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { useTelegramBotStatus } from "@/features/telegram/use-telegram-bot-status";
import { useTelegramGroups } from "@/features/telegram/use-telegram-groups";

export function TelegramGroupsPage() {
  const { organizations } = useOrganizations();
  const organization = organizations[0];
  const { groups, loading } = useTelegramGroups(organization?.id);
  const { telegramBot } = useTelegramBotStatus(organization?.id);

  return (
    <PageLayout
      title="Grupos conectados"
      description="Visualize os chats já vinculados ao bot e identifique rapidamente se a operação está pronta para convite, restrição e moderação."
      badge="Telegram"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Link2}
          label="Chats vinculados"
          value={String(groups.length)}
          description="Grupos e canais conectados"
        />
        <StatCard
          icon={Bot}
          label="Bot principal"
          value={telegramBot?.username ? `@${telegramBot.username}` : "Pendente"}
          description="Identidade operacional atual"
        />
        <StatCard
          icon={Users}
          label="Cobertura"
          value={groups.length > 0 ? "Operacional" : "Inicial"}
          description="Pronto para gerenciar acesso"
        />
      </div>

      <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Inventário de grupos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ponto único para validar permissões do bot, tipo do chat e segurança do webhook.
            </p>
          </div>
          {telegramBot?.username ? <Badge variant="success">Conectado</Badge> : <Badge variant="warning">Sem bot</Badge>}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-medium">Grupo</th>
                <th className="pb-3 font-medium">Chat ID</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Permissões</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td colSpan={5} className="py-4">
                      <Skeleton className="h-12 w-full rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6">
                    <EmptyStateCard
                      icon={ShieldCheck}
                      title="Nenhum grupo conectado ainda"
                      description="Assim que você vincular um grupo ao bot, ele aparecerá aqui com suas permissões e status operacional."
                    />
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-4">
                      <div className="font-medium text-slate-900">{group.title ?? "Grupo sem título"}</div>
                      <div className="mt-1 text-xs text-slate-500">Comunidade vinculada: {group.community_id}</div>
                    </td>
                    <td className="py-4 text-slate-500">{group.telegram_chat_id}</td>
                    <td className="py-4 capitalize text-slate-500">{group.chat_type}</td>
                    <td className="py-4 text-slate-500">
                      <div>Convida: {group.can_invite_users ? "Sim" : "Não"}</div>
                      <div>Restringe: {group.can_restrict_members ? "Sim" : "Não"}</div>
                    </td>
                    <td className="py-4">
                      {group.bot_is_admin ? <Badge variant="success">Conectado</Badge> : <Badge variant="warning">Verificar admin</Badge>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageLayout>
  );
}

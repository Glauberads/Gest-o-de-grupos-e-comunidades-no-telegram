import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { decryptSecret, encryptSecret } from "../../lib/crypto.js";
import { requireAuthenticatedUser, type AuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { telegramClient } from "../../services/telegram/telegram-client.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { TelegramBotRepository } from "./telegram-bot-repository.js";
import { TelegramGroupRepository } from "./telegram-group-repository.js";
import { TelegramChatRepository } from "./telegram-chat-repository.js";

const connectTelegramBotSchema = z.object({
  organizationId: z.uuid(),
  token: z.string().min(20)
});

const connectTelegramSchema = z.object({
  organizationId: z.uuid(),
  communityId: z.uuid(),
  telegramChatId: z.string().min(3),
  title: z.string().min(2),
  chatType: z.enum(["group", "supergroup", "channel"]).default("group"),
  botIsAdmin: z.boolean().default(true),
  canInviteUsers: z.boolean().default(true),
  canRestrictMembers: z.boolean().default(true),
  webhookSecret: z.string().min(8).optional()
});

const testMessageSchema = z.object({
  organizationId: z.uuid(),
  telegramChatId: z.string().min(3),
  text: z.string().min(2).max(4000)
});

const organizationQuerySchema = z.object({
  organizationId: z.uuid()
});

const telegramGroupParamsSchema = z.object({
  groupId: z.uuid()
});

async function ensureOrganizationAccess(
  supabase: any,
  user: AuthenticatedUser,
  organizationId: string,
  requireActive = true
) {
  const organizationRepository = new OrganizationRepository(supabase);
  await organizationRepository.ensureMembership(organizationId, user.id);
  const organization = await organizationRepository.findById(organizationId);

  if (requireActive && !user.isSuperAdmin && organization.status !== "active") {
    throw new Error("Organization subscription must be active to access Telegram resources");
  }

  return organization;
}

async function createBotLog(
  supabase: any,
  input: {
    organizationId: string;
    communityId?: string | null;
    action: string;
    status?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await (supabase as any).from("bot_logs").insert({
    organization_id: input.organizationId,
    community_id: input.communityId ?? null,
    action: input.action,
    status: input.status ?? "success",
    message: input.message ?? null,
    metadata: input.metadata ?? {}
  });
}

export const telegramRoutes: FastifyPluginAsync = async (app) => {
  app.post("/telegram/bot/connect", async (request, reply) => {
    const payload = connectTelegramBotSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await ensureOrganizationAccess(supabase, user, payload.organizationId, true);

    const me = await telegramClient.getMe(payload.token);
    const telegramBot = (await new TelegramBotRepository(supabase).upsert({
      organization_id: payload.organizationId,
      encrypted_token: encryptSecret(payload.token),
      name: me.first_name ?? me.username ?? "Telegram Bot",
      username: me.username ?? null,
      last_validated_at: new Date().toISOString(),
      is_active: true
    })) as any;

    await createBotLog(supabase, {
      organizationId: payload.organizationId,
      action: "telegram_bot_connected",
      message: `Bot @${me.username ?? "sem-username"} validado com sucesso.`,
      metadata: {
        username: me.username ?? null,
        botId: telegramBot.id
      }
    });

    return reply.code(200).send({
      telegramBot: {
        id: telegramBot.id,
        organizationId: telegramBot.organization_id,
        name: telegramBot.name,
        username: telegramBot.username,
        isActive: telegramBot.is_active,
        lastValidatedAt: telegramBot.last_validated_at
      }
    });
  });

  app.get("/telegram/bot/status", async (request, reply) => {
    const query = organizationQuerySchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await ensureOrganizationAccess(supabase, user, query.organizationId, true);

    const telegramBot = await new TelegramBotRepository(supabase).findByOrganization(
      query.organizationId
    );

    return reply.code(200).send({
      telegramBot: telegramBot
        ? {
            id: telegramBot.id,
            name: telegramBot.name,
            username: telegramBot.username,
            isActive: telegramBot.is_active,
            lastValidatedAt: telegramBot.last_validated_at
          }
        : null
    });
  });

  app.post("/telegram/test-message", async (request, reply) => {
    const payload = testMessageSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await ensureOrganizationAccess(supabase, user, payload.organizationId, true);

    const telegramBot = await new TelegramBotRepository(supabase).findByOrganization(
      payload.organizationId
    );

    if (!telegramBot) {
      return reply.code(404).send({ message: "Telegram bot is not connected yet" });
    }

    const result = await telegramClient.sendMessage(
      decryptSecret(telegramBot.encrypted_token),
      payload.telegramChatId,
      payload.text
    );

    await createBotLog(supabase, {
      organizationId: payload.organizationId,
      action: "telegram_test_message_sent",
      message: "Mensagem teste enviada com sucesso.",
      metadata: {
        telegramChatId: payload.telegramChatId
      }
    });

    return reply.code(200).send({ result });
  });

  app.post("/telegram/connect", async (request, reply) => {
    const payload = connectTelegramSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await ensureOrganizationAccess(supabase, user, payload.organizationId, true);

    const telegramChat = await new TelegramChatRepository(supabase).upsert({
      organization_id: payload.organizationId,
      community_id: payload.communityId,
      telegram_chat_id: payload.telegramChatId,
      title: payload.title,
      chat_type: payload.chatType,
      bot_is_admin: payload.botIsAdmin,
      can_invite_users: payload.canInviteUsers,
      can_restrict_members: payload.canRestrictMembers,
      webhook_secret: payload.webhookSecret
    });

    await createBotLog(supabase, {
      organizationId: payload.organizationId,
      communityId: payload.communityId,
      action: "telegram_chat_connected",
      message: `Chat ${payload.title} vinculado à comunidade.`,
      metadata: {
        telegramChatId: payload.telegramChatId,
        botIsAdmin: payload.botIsAdmin
      }
    });

    return reply.code(200).send({ telegramChat });
  });

  app.post("/telegram/groups", async (request, reply) => {
    const payload = connectTelegramSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await ensureOrganizationAccess(supabase, user, payload.organizationId, true);

    const telegramBot = await new TelegramBotRepository(supabase).findByOrganization(
      payload.organizationId
    );

    const telegramGroup = await new TelegramGroupRepository(supabase).upsert({
      organization_id: payload.organizationId,
      community_id: payload.communityId,
      telegram_bot_id: telegramBot?.id ?? null,
      telegram_chat_id: payload.telegramChatId,
      title: payload.title,
      chat_type: payload.chatType,
      auto_approve_enabled: payload.botIsAdmin && payload.canInviteUsers,
      welcome_message: null
    });

    const telegramChat = await new TelegramChatRepository(supabase).upsert({
      organization_id: payload.organizationId,
      community_id: payload.communityId,
      telegram_chat_id: payload.telegramChatId,
      title: payload.title,
      chat_type: payload.chatType,
      bot_is_admin: payload.botIsAdmin,
      can_invite_users: payload.canInviteUsers,
      can_restrict_members: payload.canRestrictMembers,
      webhook_secret: payload.webhookSecret
    });

    await createBotLog(supabase, {
      organizationId: payload.organizationId,
      communityId: payload.communityId,
      action: "telegram_group_connected",
      message: `Grupo ${payload.title} conectado com sucesso.`,
      metadata: {
        telegramChatId: payload.telegramChatId,
        canInviteUsers: payload.canInviteUsers,
        canRestrictMembers: payload.canRestrictMembers
      }
    });

    return reply.code(200).send({ telegramGroup, telegramChat });
  });

  app.get("/telegram/groups", async (request, reply) => {
    const query = organizationQuerySchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await ensureOrganizationAccess(supabase, user, query.organizationId, true);

    const groups = await new TelegramGroupRepository(supabase).listByOrganization(
      query.organizationId
    );

    return reply.code(200).send({ groups });
  });

  app.get("/telegram/groups/:groupId", async (request, reply) => {
    const params = telegramGroupParamsSchema.parse(request.params);
    const query = organizationQuerySchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await ensureOrganizationAccess(supabase, user, query.organizationId, true);

    const group = (await new TelegramGroupRepository(supabase).findById(params.groupId)) as any;

    if (!group || group.organization_id !== query.organizationId) {
      return reply.code(404).send({ message: "Telegram group not found" });
    }

    return reply.code(200).send({ group });
  });

  app.get("/telegram/logs", async (request, reply) => {
    const query = organizationQuerySchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await ensureOrganizationAccess(supabase, user, query.organizationId, true);

    const logsResult = await (supabase as any)
      .from("bot_logs")
      .select("id, organization_id, community_id, action, status, message, metadata, created_at")
      .eq("organization_id", query.organizationId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (logsResult.error) {
      return reply.code(500).send({ message: "Failed to load Telegram logs" });
    }

    return reply.code(200).send({ logs: logsResult.data ?? [] });
  });

  app.get("/telegram/connect", async (request, reply) => {
    const querySchema = z.object({
      organizationId: z.uuid(),
      communityId: z.uuid()
    });

    const query = querySchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await ensureOrganizationAccess(supabase, user, query.organizationId, true);

    const telegramChat = await new TelegramChatRepository(supabase).findByCommunity(
      query.organizationId,
      query.communityId
    );

    return reply.code(200).send({ telegramChat });
  });
};

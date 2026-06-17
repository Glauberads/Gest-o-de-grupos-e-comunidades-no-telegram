import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { decryptSecret, encryptSecret } from "../../lib/crypto.js";
import { requireAuthenticatedUser } from "../../lib/auth.js";
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

export const telegramRoutes: FastifyPluginAsync = async (app) => {
  app.post("/telegram/bot/connect", async (request, reply) => {
    const payload = connectTelegramBotSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizationRepository = new OrganizationRepository(supabase);
    await organizationRepository.ensureMembership(payload.organizationId, user.id);
    const organization = await organizationRepository.findById(payload.organizationId);

    if (!user.isSuperAdmin && organization.status !== "active") {
      return reply.code(403).send({
        message: "Organization subscription must be active to connect Telegram bot"
      });
    }

    const me = await telegramClient.getMe(payload.token);
    const telegramBot = (await new TelegramBotRepository(supabase).upsert({
      organization_id: payload.organizationId,
      encrypted_token: encryptSecret(payload.token),
      name: me.first_name ?? me.username ?? "Telegram Bot",
      username: me.username ?? null,
      last_validated_at: new Date().toISOString(),
      is_active: true
    })) as any;

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
    const querySchema = z.object({
      organizationId: z.uuid()
    });

    const query = querySchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizationRepository = new OrganizationRepository(supabase);
    await organizationRepository.ensureMembership(query.organizationId, user.id);

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

    const organizationRepository = new OrganizationRepository(supabase);
    await organizationRepository.ensureMembership(payload.organizationId, user.id);

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

    return reply.code(200).send({ result });
  });

  app.post("/telegram/connect", async (request, reply) => {
    const payload = connectTelegramSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await new OrganizationRepository(supabase).ensureMembership(
      payload.organizationId,
      user.id
    );

    const organization = await new OrganizationRepository(supabase).findById(
      payload.organizationId
    );

    if (!user.isSuperAdmin && organization.status !== "active") {
      return reply.code(403).send({
        message: "Organization subscription must be active to connect Telegram"
      });
    }

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

    return reply.code(200).send({ telegramChat });
  });

  app.post("/telegram/groups", async (request, reply) => {
    const payload = connectTelegramSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizationRepository = new OrganizationRepository(supabase);
    await organizationRepository.ensureMembership(payload.organizationId, user.id);
    const organization = await organizationRepository.findById(payload.organizationId);

    if (!user.isSuperAdmin && organization.status !== "active") {
      return reply.code(403).send({
        message: "Organization subscription must be active to connect Telegram"
      });
    }

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

    return reply.code(200).send({ telegramGroup, telegramChat });
  });

  app.get("/telegram/groups", async (request, reply) => {
    const querySchema = z.object({
      organizationId: z.uuid()
    });

    const query = querySchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizationRepository = new OrganizationRepository(supabase);
    await organizationRepository.ensureMembership(query.organizationId, user.id);

    const groups = await new TelegramGroupRepository(supabase).listByOrganization(
      query.organizationId
    );

    return reply.code(200).send({ groups });
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

    await new OrganizationRepository(supabase).ensureMembership(
      query.organizationId,
      user.id
    );

    const organization = await new OrganizationRepository(supabase).findById(
      query.organizationId
    );

    if (!user.isSuperAdmin && organization.status !== "active") {
      return reply.code(403).send({
        message: "Organization subscription must be active to access Telegram settings"
      });
    }

    const telegramChat = await new TelegramChatRepository(supabase).findByCommunity(
      query.organizationId,
      query.communityId
    );

    return reply.code(200).send({ telegramChat });
  });
};

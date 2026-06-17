import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { requireAuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { TelegramChatRepository } from "./telegram-chat-repository.js";

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

export const telegramRoutes: FastifyPluginAsync = async (app) => {
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

    const telegramChat = await new TelegramChatRepository(supabase).findByCommunity(
      query.organizationId,
      query.communityId
    );

    return reply.code(200).send({ telegramChat });
  });
};


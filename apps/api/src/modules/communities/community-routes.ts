import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { requireAuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { CommunityRepository } from "./community-repository.js";

const createCommunitySchema = z.object({
  organizationId: z.uuid(),
  name: z.string().min(3),
  description: z.string().min(3),
  telegramChatId: z.string().min(3),
  publicSlug: z.string().min(3),
  publicUrl: z.url().optional(),
  imageUrl: z.url().optional(),
  welcomeMessage: z.string().optional(),
  autoApproveEnabled: z.boolean().default(true)
});

export const communityRoutes: FastifyPluginAsync = async (app) => {
  app.post("/communities", async (request, reply) => {
    const payload = createCommunitySchema.parse(request.body);
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
        message: "Organization subscription must be active to manage communities"
      });
    }

    const community = await new CommunityRepository(supabase).create({
      organization_id: payload.organizationId,
      name: payload.name,
      description: payload.description,
      public_slug: payload.publicSlug,
      public_url: payload.publicUrl,
      image_url: payload.imageUrl,
      welcome_message: payload.welcomeMessage,
      auto_approve_enabled: payload.autoApproveEnabled
    });

    return reply.code(201).send({
      community,
      telegramChatId: payload.telegramChatId
    });
  });

  app.get("/communities", async (request, reply) => {
    const user = await requireAuthenticatedUser(request);
    const organizationId = z.uuid().parse(request.query && (request.query as { organizationId?: string }).organizationId);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await new OrganizationRepository(supabase).ensureMembership(organizationId, user.id);

    const organization = await new OrganizationRepository(supabase).findById(
      organizationId
    );

    if (!user.isSuperAdmin && organization.status !== "active") {
      return reply.code(403).send({
        message: "Organization subscription must be active to access communities"
      });
    }

    const communities = await new CommunityRepository(supabase).listByOrganization(
      organizationId
    );

    return reply.code(200).send({
      communities
    });
  });
};

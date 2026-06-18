import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { requireAuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { AuditLogService } from "../../services/audit/audit-log-service.js";

const auditLogFiltersSchema = z.object({
  category: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  organizationId: z.uuid().optional(),
  userId: z.uuid().optional(),
  action: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional()
});

const auditLogIdParamsSchema = z.object({
  id: z.uuid()
});

export const auditRoutes: FastifyPluginAsync = async (app) => {
  app.get("/audit-logs", async (request, reply) => {
    const query = auditLogFiltersSchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizationId = query.organizationId;

    if (!organizationId) {
      return reply.code(400).send({ message: "organizationId é obrigatório para listar os logs do tenant." });
    }

    await new OrganizationRepository(supabase).ensureMembership(organizationId, user.id);

    const logs = await new AuditLogService(supabase).listForOrganization(organizationId, {
      category: query.category,
      severity: query.severity,
      status: query.status,
      action: query.action,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      search: query.search
    });

    return reply.code(200).send({ logs });
  });

  app.get("/admin/audit-logs", async (request, reply) => {
    const query = auditLogFiltersSchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);

    if (!user.isSuperAdmin) {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const logs = await new AuditLogService(supabase).listForAdmin(query);

    return reply.code(200).send({ logs });
  });

  app.get("/admin/audit-logs/:id", async (request, reply) => {
    const params = auditLogIdParamsSchema.parse(request.params);
    const user = await requireAuthenticatedUser(request);

    if (!user.isSuperAdmin) {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const log = await new AuditLogService(supabase).getById(params.id);

    return reply.code(200).send({ log });
  });
};

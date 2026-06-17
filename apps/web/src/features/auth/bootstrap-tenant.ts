import { apiRequest } from "@/lib/api";

export type BootstrapResponse = {
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  user: {
    id: string;
    email: string;
    fullName: string;
  };
};

export async function bootstrapTenant(organizationName: string) {
  return apiRequest<BootstrapResponse>("/api/auth/bootstrap", {
    method: "POST",
    body: {
      organizationName
    }
  });
}


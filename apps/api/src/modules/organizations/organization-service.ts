import { AuthRepository } from "../auth/auth-repository.js";
import { slugify } from "../../utils/slugify.js";
import { OrganizationRepository } from "./organization-repository.js";

export class OrganizationService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly organizationRepository: OrganizationRepository
  ) {}

  async bootstrapOwner(input: {
    userId: string;
    email: string;
    fullName: string;
    organizationName: string;
  }) {
    await this.authRepository.upsertUser({
      id: input.userId,
      email: input.email,
      fullName: input.fullName
    });

    const organizations = await this.organizationRepository.findByOwnerUserId(
      input.userId
    );

    if (organizations.length > 0) {
      return organizations[0];
    }

    return this.organizationRepository.create({
      ownerUserId: input.userId,
      name: input.organizationName,
      slug: `${slugify(input.organizationName)}-${input.userId.slice(0, 8)}`
    });
  }
}


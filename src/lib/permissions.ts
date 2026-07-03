import { prisma } from '@/lib/prisma';
import type { Role } from '@/types/analysis';

const INVITABLE_ROLES: Role[] = ['pm', 'developer', 'stakeholder'];

export function getMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

/** Stakeholders are read-only; every other role can edit tickets/estimates/etc. */
export function canEditProject(role: string): boolean {
  return role !== 'stakeholder';
}

export function isInvitableRole(role: unknown): role is Role {
  return typeof role === 'string' && INVITABLE_ROLES.includes(role as Role);
}

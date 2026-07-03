import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMembership, isInvitableRole } from '@/lib/permissions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, userId } = await params;
  const callerMembership = await getMembership(id, session.user.id);
  if (!callerMembership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (callerMembership.role !== 'owner') {
    return NextResponse.json({ error: 'Only the project owner can change roles' }, { status: 403 });
  }

  const target = await getMembership(id, userId);
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  if (target.role === 'owner') {
    return NextResponse.json({ error: "The owner's role can't be changed" }, { status: 400 });
  }

  const body = await request.json() as { role?: string };
  if (!isInvitableRole(body.role)) {
    return NextResponse.json({ error: 'Role must be one of: pm, developer, stakeholder' }, { status: 400 });
  }

  const updated = await prisma.projectMember.update({
    where: { projectId_userId: { projectId: id, userId } },
    data: { role: body.role },
  });
  return NextResponse.json({ userId, role: updated.role });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, userId } = await params;
  const callerMembership = await getMembership(id, session.user.id);
  if (!callerMembership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (callerMembership.role !== 'owner') {
    return NextResponse.json({ error: 'Only the project owner can remove people' }, { status: 403 });
  }

  const target = await getMembership(id, userId);
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'The owner cannot be removed' }, { status: 400 });
  }

  await prisma.projectMember.delete({ where: { projectId_userId: { projectId: id, userId } } });
  return NextResponse.json({ ok: true });
}

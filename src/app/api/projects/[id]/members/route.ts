import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMembership, isInvitableRole } from '@/lib/permissions';
import { sendProjectInviteEmail } from '@/lib/email';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(id, session.user.id);
  if (!membership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'asc' },
    select: { userId: true, role: true, user: { select: { email: true, name: true } } },
  });

  return NextResponse.json(
    members.map((m) => ({ userId: m.userId, role: m.role, email: m.user.email, name: m.user.name })),
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(id, session.user.id);
  if (!membership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only the project owner can invite people' }, { status: 403 });
  }

  const body = await request.json() as { email?: string; role?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  if (!isInvitableRole(body.role)) {
    return NextResponse.json({ error: 'Role must be one of: pm, developer, stakeholder' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) {
    return NextResponse.json({ error: 'No account found with that email — they need to sign up first' }, { status: 404 });
  }

  const existing = await getMembership(id, targetUser.id);
  if (existing) return NextResponse.json({ error: 'This person is already on the project' }, { status: 409 });

  const [created, project] = await Promise.all([
    prisma.projectMember.create({ data: { projectId: id, userId: targetUser.id, role: body.role } }),
    prisma.project.findUnique({ where: { id }, select: { name: true } }),
  ]);

  await sendProjectInviteEmail({
    to: targetUser.email,
    inviterName: session.user.name ?? session.user.email ?? 'Someone',
    projectName: project?.name ?? 'a project',
    role: created.role,
    appUrl: request.nextUrl.origin,
  });

  return NextResponse.json({ userId: targetUser.id, role: created.role, email: targetUser.email, name: targetUser.name });
}

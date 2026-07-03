import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMembership } from '@/lib/permissions';

async function requireOwner(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const membership = await getMembership(id, session.user.id);
  if (!membership) return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) };
  if (membership.role !== 'owner') {
    return { error: NextResponse.json({ error: 'Only the project owner can manage the public link' }, { status: 403 }) };
  }
  return {};
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const { error } = await requireOwner(id);
  if (error) return error;

  const project = await prisma.project.findUnique({ where: { id }, select: { shareToken: true } });
  return NextResponse.json({ token: project?.shareToken ?? null });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const { error } = await requireOwner(id);
  if (error) return error;

  const token = randomBytes(24).toString('base64url');
  await prisma.project.update({ where: { id }, data: { shareToken: token } });
  return NextResponse.json({ token });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const { error } = await requireOwner(id);
  if (error) return error;

  await prisma.project.update({ where: { id }, data: { shareToken: null } });
  return NextResponse.json({ ok: true });
}

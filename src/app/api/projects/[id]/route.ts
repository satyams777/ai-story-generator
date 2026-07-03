import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMembership, canEditProject } from '@/lib/permissions';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(id, session.user.id);
  if (!membership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const jiraTarget = project.jiraProjectKey && project.jiraIssueTypeId
    ? {
        jiraProjectKey: project.jiraProjectKey,
        jiraIssueTypeId: project.jiraIssueTypeId,
        jiraIssueTypeName: project.jiraIssueTypeName,
      }
    : null;

  return NextResponse.json({
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    role: membership.role,
    jiraTarget,
    ...JSON.parse(project.data),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(id, session.user.id);
  if (!membership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (!canEditProject(membership.role)) {
    return NextResponse.json({ error: 'Stakeholders have read-only access to this project' }, { status: 403 });
  }

  try {
    const body = await request.json() as { name?: string; result?: unknown; hoursPerPoint?: number };
    const updateData: { name?: string; data?: string } = {};

    if (typeof body.name === 'string' && body.name.trim()) updateData.name = body.name.trim();
    if (body.result) {
      updateData.data = JSON.stringify({ result: body.result, hoursPerPoint: body.hoursPerPoint ?? 4 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update project';
    console.error('[projects:update]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(id, session.user.id);
  if (!membership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only the project owner can delete it' }, { status: 403 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

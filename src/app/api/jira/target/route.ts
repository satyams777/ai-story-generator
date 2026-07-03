import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMembership } from '@/lib/permissions';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    appProjectId?: string;
    jiraProjectKey?: string;
    jiraIssueTypeId?: string;
    jiraIssueTypeName?: string;
  };
  const { appProjectId, jiraProjectKey, jiraIssueTypeId, jiraIssueTypeName } = body;
  if (!appProjectId || !jiraProjectKey || !jiraIssueTypeId || !jiraIssueTypeName) {
    return NextResponse.json({ error: 'appProjectId, jiraProjectKey, jiraIssueTypeId and jiraIssueTypeName are all required' }, { status: 400 });
  }

  const membership = await getMembership(appProjectId, session.user.id);
  if (!membership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only the project owner can configure the Jira target' }, { status: 403 });
  }

  await prisma.project.update({
    where: { id: appProjectId },
    data: { jiraProjectKey, jiraIssueTypeId, jiraIssueTypeName },
  });

  return NextResponse.json({ jiraProjectKey, jiraIssueTypeId, jiraIssueTypeName });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const appProjectId = request.nextUrl.searchParams.get('appProjectId');
  if (!appProjectId) return NextResponse.json({ error: 'appProjectId query param is required' }, { status: 400 });

  const membership = await getMembership(appProjectId, session.user.id);
  if (!membership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only the project owner can change the Jira target' }, { status: 403 });
  }

  await prisma.project.update({
    where: { id: appProjectId },
    data: { jiraProjectKey: null, jiraIssueTypeId: null, jiraIssueTypeName: null },
  });

  return NextResponse.json({ ok: true });
}

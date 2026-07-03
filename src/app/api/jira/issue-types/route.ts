import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { fetchJiraIssueTypes } from '@/lib/jira';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId query param is required' }, { status: 400 });

  const connection = await prisma.jiraConnection.findUnique({ where: { userId: session.user.id } });
  if (!connection) return NextResponse.json({ error: 'Connect a Jira account first' }, { status: 400 });

  try {
    const types = await fetchJiraIssueTypes(connection, projectId);
    return NextResponse.json(types);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch issue types';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

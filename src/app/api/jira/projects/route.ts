import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { fetchJiraProjects } from '@/lib/jira';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const connection = await prisma.jiraConnection.findUnique({ where: { userId: session.user.id } });
  if (!connection) return NextResponse.json({ error: 'Connect a Jira account first' }, { status: 400 });

  try {
    const projects = await fetchJiraProjects(connection);
    return NextResponse.json(projects);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch Jira projects';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

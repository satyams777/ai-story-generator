import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMembership, canEditProject } from '@/lib/permissions';
import { createJiraIssue, jiraIssueUrl } from '@/lib/jira';
import type { AnalysisResult, Ticket } from '@/types/analysis';

interface PushResult {
  ticketId: string;
  ok: boolean;
  jiraKey?: string;
  jiraUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { appProjectId?: string; ticketIds?: string[] };
  const { appProjectId, ticketIds } = body;
  if (!appProjectId || !ticketIds || ticketIds.length === 0) {
    return NextResponse.json({ error: 'appProjectId and ticketIds are required' }, { status: 400 });
  }

  const membership = await getMembership(appProjectId, session.user.id);
  if (!membership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (!canEditProject(membership.role)) {
    return NextResponse.json({ error: 'Stakeholders have read-only access to this project' }, { status: 403 });
  }

  const [project, connection] = await Promise.all([
    prisma.project.findUnique({ where: { id: appProjectId } }),
    prisma.jiraConnection.findUnique({ where: { userId: session.user.id } }),
  ]);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (!connection) return NextResponse.json({ error: 'Connect a Jira account first' }, { status: 400 });
  if (!project.jiraProjectKey || !project.jiraIssueTypeId) {
    return NextResponse.json({ error: 'Choose a target Jira project for this project first' }, { status: 400 });
  }

  const stored = JSON.parse(project.data) as { result: AnalysisResult; hoursPerPoint: number };
  const tickets = stored.result.tickets;
  const ticketMap = new Map(tickets.map((t) => [t.id, t]));

  const results: PushResult[] = [];

  for (const ticketId of ticketIds) {
    const ticket = ticketMap.get(ticketId);
    if (!ticket) {
      results.push({ ticketId, ok: false, error: 'Ticket not found' });
      continue;
    }
    if (ticket.jiraKey) {
      results.push({ ticketId, ok: true, jiraKey: ticket.jiraKey, jiraUrl: ticket.jiraUrl });
      continue;
    }

    try {
      const { key } = await createJiraIssue(connection, {
        projectKey: project.jiraProjectKey,
        issueTypeId: project.jiraIssueTypeId,
        summary: ticket.title,
        description: ticket.description,
        checklist: ticket.checklist,
      });
      const url = jiraIssueUrl(connection.siteUrl, key);
      ticket.jiraKey = key;
      ticket.jiraUrl = url;
      results.push({ ticketId, ok: true, jiraKey: key, jiraUrl: url });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create Jira issue';
      results.push({ ticketId, ok: false, error: message });
    }
  }

  const updatedTickets: Ticket[] = tickets.map((t) => ticketMap.get(t.id) ?? t);
  await prisma.project.update({
    where: { id: appProjectId },
    data: { data: JSON.stringify({ ...stored, result: { ...stored.result, tickets: updatedTickets } }) },
  });

  return NextResponse.json({ results });
}

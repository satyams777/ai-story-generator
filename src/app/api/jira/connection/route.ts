import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { verifyJiraCredentials } from '@/lib/jira';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const connection = await prisma.jiraConnection.findUnique({ where: { userId: session.user.id } });
  if (!connection) return NextResponse.json({ connected: false });

  return NextResponse.json({ connected: true, siteUrl: connection.siteUrl, email: connection.email });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { siteUrl?: string; email?: string; apiToken?: string };
  const siteUrl = body.siteUrl?.trim();
  const email = body.email?.trim();
  const apiToken = body.apiToken?.trim();

  if (!siteUrl || !email || !apiToken) {
    return NextResponse.json({ error: 'Site URL, email, and API token are all required' }, { status: 400 });
  }

  const normalizedUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
  const check = await verifyJiraCredentials({ siteUrl: normalizedUrl, email, apiToken });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  await prisma.jiraConnection.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, siteUrl: normalizedUrl, email, apiToken },
    update: { siteUrl: normalizedUrl, email, apiToken },
  });

  return NextResponse.json({ connected: true, siteUrl: normalizedUrl, email });
}

export async function DELETE(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.jiraConnection.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}

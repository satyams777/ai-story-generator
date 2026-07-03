import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { AnalysisResult } from '@/types/analysis';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: session.user.id } } },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      members: { where: { userId: session.user.id }, select: { role: true } },
    },
  });

  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      role: p.members[0]?.role ?? 'stakeholder',
    })),
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { name?: string; result: AnalysisResult; hoursPerPoint: number };
    if (!body.result) return NextResponse.json({ error: 'Missing analysis result' }, { status: 400 });

    const name = body.name?.trim() || body.result.summary?.slice(0, 60) || `Untitled project`;
    const project = await prisma.project.create({
      data: {
        name,
        userId: session.user.id,
        data: JSON.stringify({ result: body.result, hoursPerPoint: body.hoursPerPoint ?? 4 }),
        members: { create: { userId: session.user.id, role: 'owner' } },
      },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ ...project, role: 'owner' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save project';
    console.error('[projects:create]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

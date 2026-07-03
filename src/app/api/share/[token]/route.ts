import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public, unauthenticated endpoint — anyone with the token gets read-only
// access, equivalent to the "stakeholder" role. No session/membership check.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;

  const project = await prisma.project.findUnique({ where: { shareToken: token } });
  if (!project) return NextResponse.json({ error: 'This link is invalid or has been revoked' }, { status: 404 });

  const { result, hoursPerPoint } = JSON.parse(project.data) as { result: unknown; hoursPerPoint?: number };
  return NextResponse.json({ name: project.name, result, hoursPerPoint: hoursPerPoint ?? 4 });
}

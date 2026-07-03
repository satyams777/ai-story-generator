import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { MODEL } from '@/lib/gemini';
import { auth } from '@/auth';
import { getMembership } from '@/lib/permissions';

type Section =
  | 'summary'
  | 'techStack'
  | 'risks'
  | 'assumptions'
  | 'userStories'
  | 'functionalRequirements'
  | 'nonFunctionalRequirements';

function getClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set');
  return new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
}

const SECTION_SCHEMAS: Record<Section, string> = {
  summary: `Return: {"summary": "rewritten executive summary text (2-3 paragraphs)"}`,
  techStack: `Return: {"techStack": {"frontend": [{"name":"...","reason":"..."}], "backend": [...], "database": [...], "devops": [...], "thirdParty": [...]}}`,
  risks: `Return: {"risks": [{"description":"...","impact":"High|Medium|Low","probability":"High|Medium|Low","mitigation":"..."}]}`,
  assumptions: `Return: {"assumptions": [{"id":"A-1","description":"...","category":"Technical|Business|Scope|Timeline"}]}`,
  userStories: `Return: {"userStories": [{"id":"US-1","actor":"...","goal":"...","benefit":"...","acceptanceCriteria":["..."]}]}`,
  functionalRequirements: `Return: {"functionalRequirements": [{"id":"FR-1","description":"...","priority":"High|Medium|Low"}]}`,
  nonFunctionalRequirements: `Return: {"nonFunctionalRequirements": [{"id":"NFR-1","description":"...","priority":"High|Medium|Low"}]}`,
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { section, instruction, currentContent, projectSummary, projectId } = (await req.json()) as {
      section: Section;
      instruction: string;
      currentContent: unknown;
      projectSummary: string;
      projectId: string;
    };

    if (!section || !instruction?.trim()) {
      return NextResponse.json({ error: 'section and instruction are required' }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const membership = await getMembership(projectId, session.user.id);
    if (!membership) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the project owner can refine sections with AI' }, { status: 403 });
    }

    const client = getClient();

    const prompt = `You are an expert business analyst refining a project analysis section.

Project context:
${projectSummary?.slice(0, 800) ?? 'No context provided.'}

Section to refine: "${section}"
Refinement instruction from user: "${instruction}"

Current content of this section:
${JSON.stringify(currentContent, null, 2)}

${SECTION_SCHEMAS[section]}

Apply the user's instruction to meaningfully refine the content. Return ONLY valid JSON, no markdown, no explanation.`;

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    return NextResponse.json({ data: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Refine failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

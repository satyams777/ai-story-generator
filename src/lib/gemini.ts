import OpenAI from 'openai';
import type { AnalysisResult, Ticket } from '@/types/analysis';
import { estimateTickets } from './estimator';

function getClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set in environment variables');
  return new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
}

export const MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an expert business analyst and software architect. Analyze the requirements document and return ONLY a valid JSON object — no markdown, no code blocks, no explanation.

Return this exact shape:
{
  "summary": "Executive summary in 2-3 paragraphs",
  "actors": [{"name": "string", "role": "string"}],
  "functionalRequirements": [{"id": "FR-1", "description": "string", "priority": "High|Medium|Low"}],
  "nonFunctionalRequirements": [{"id": "NFR-1", "description": "string", "priority": "High|Medium|Low"}],
  "risks": [{"description": "string", "impact": "High|Medium|Low", "probability": "High|Medium|Low", "mitigation": "string"}],
  "techStack": {
    "frontend": [{"name": "React", "reason": "one-line reason"}],
    "backend": [{"name": "Node.js", "reason": "one-line reason"}],
    "database": [{"name": "PostgreSQL", "reason": "one-line reason"}],
    "devops": [{"name": "Docker", "reason": "one-line reason"}],
    "thirdParty": [{"name": "Stripe", "reason": "one-line reason"}]
  },
  "userStories": [
    {
      "id": "US-1",
      "actor": "Customer",
      "goal": "upload a requirements document",
      "benefit": "receive instant project analysis",
      "acceptanceCriteria": ["Given a PDF, when uploaded, then text is extracted within 5s"]
    }
  ],
  "tickets": [
    {"id": "T-1", "title": "Build file upload component", "type": "Frontend", "storyId": "US-1"},
    {"id": "T-2", "title": "Implement PDF parsing endpoint", "type": "Backend", "storyId": "US-1"}
  ],
  "diagrams": {
    "flowDiagram": "flowchart TD\\n  A[User Uploads File] --> B[Parse Document]\\n  B --> C[AI Analysis]\\n  C --> D[Dashboard]",
    "architectureDiagram": "graph LR\\n  Client[Next.js] --> API[Node API]\\n  API --> AI[Groq AI]\\n  API --> Parser[File Parser]"
  }
}

Generate at least 5 user stories, 2-3 tickets per story, 3-6 risks, and 2-4 items per tech stack category. Mermaid syntax must be valid.`;

type RawResult = Omit<AnalysisResult, 'tickets' | 'estimate'> & {
  tickets: Omit<Ticket, 'effortPoints' | 'hours'>[];
};

export async function analyzeRequirements(text: string): Promise<AnalysisResult> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Requirements Document:\n\n${text}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? '';

  let parsed: RawResult;
  try {
    parsed = JSON.parse(raw) as RawResult;
  } catch {
    throw new Error(`AI returned invalid JSON. Raw: ${raw.slice(0, 300)}`);
  }

  // Ensure techStack has all keys even if AI omitted some
  parsed.techStack = {
    frontend: [], backend: [], database: [], devops: [], thirdParty: [],
    ...parsed.techStack,
  };

  const { tickets, estimate } = estimateTickets(parsed.tickets ?? []);
  return { ...parsed, tickets, estimate };
}

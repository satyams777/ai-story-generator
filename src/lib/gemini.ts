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
    {"id": "T-1", "title": "Build file upload component", "description": "1-3 sentences on scope, approach and edge cases to handle", "checklist": ["Specific implementation step 1 for this ticket", "Specific implementation step 2", "Specific implementation step 3"], "type": "Frontend", "storyId": "US-1", "moscow": "Must"},
    {"id": "T-2", "title": "Implement PDF parsing endpoint", "description": "1-3 sentences on scope, approach and edge cases to handle", "checklist": ["Specific implementation step 1 for this ticket", "Specific implementation step 2", "Specific implementation step 3"], "type": "Backend", "storyId": "US-1", "moscow": "Must"}
  ],
  "assumptions": [
    {"id": "A-1", "description": "Team has experience with the recommended tech stack", "category": "Technical"},
    {"id": "A-2", "description": "Third-party API credentials will be provided before development starts", "category": "Business"},
    {"id": "A-3", "description": "All in-scope features are covered by the requirements document", "category": "Scope"},
    {"id": "A-4", "description": "Timeline assumes a standard 40h/week team velocity", "category": "Timeline"}
  ],
  "milestones": [
    {"id": "M-1", "name": "Foundation", "phase": 1, "description": "Core infrastructure, authentication, database schema, and CI/CD pipeline", "ticketIds": ["T-1", "T-2"]},
    {"id": "M-2", "name": "Core Features", "phase": 2, "description": "Primary user-facing features and main business logic", "ticketIds": ["T-3", "T-4", "T-5"]},
    {"id": "M-3", "name": "Launch Ready", "phase": 3, "description": "QA hardening, performance tuning, DevOps and production readiness", "ticketIds": ["T-6", "T-7"]}
  ],
  "diagrams": {
    "flowDiagram": "flowchart TD\\n  A[User Uploads File] --> B[Parse Document]\\n  B --> C[AI Analysis]\\n  C --> D[Dashboard]",
    "architectureDiagram": "graph LR\\n  Client[Next.js] --> API[Node API]\\n  API --> AI[Groq AI]\\n  API --> Parser[File Parser]",
    "sequenceDiagram": "sequenceDiagram\\n  actor User\\n  participant UI\\n  participant API\\n  participant DB\\n  User->>UI: Submit request\\n  UI->>API: POST /resource\\n  API->>DB: Persist\\n  DB-->>API: OK\\n  API-->>UI: 201 Created\\n  UI-->>User: Confirmation",
    "erDiagram": "erDiagram\\n  USER ||--o{ ORDER : places\\n  ORDER ||--|{ LINE_ITEM : contains\\n  USER {\\n    int id PK\\n    string email\\n  }\\n  ORDER {\\n    int id PK\\n    int userId FK\\n  }",
    "stateDiagram": "stateDiagram-v2\\n  [*] --> Draft\\n  Draft --> Submitted: submit\\n  Submitted --> Approved: approve\\n  Submitted --> Rejected: reject\\n  Approved --> [*]"
  }
}

Rules:
- Generate at least 5 user stories, 2-3 tickets per story, 3-6 risks, and 2-4 items per tech stack category.
- Every ticket must have a "moscow" field: "Must" (core, without it the product fails), "Should" (important but not critical), "Could" (nice-to-have), or "Wont" (out of scope for now).
- Every ticket must have a "description": 1-3 sentences covering scope, technical approach, and any edge cases.
- Every ticket must have a "checklist": 3-5 concrete implementation steps specific to THAT ticket (not generic advice).
- Generate 4-8 assumptions covering Technical, Business, Scope, and Timeline categories.
- Generate exactly 3 milestones (Phase 1, 2, 3). All ticket IDs must appear in exactly one milestone's ticketIds array.
- Generate ALL FIVE diagrams, each tailored to THIS project's domain (not the generic examples above):
  - flowDiagram: the primary end-to-end user/business process ("flowchart TD").
  - architectureDiagram: the system components and how they connect ("graph LR").
  - sequenceDiagram: the most important runtime interaction between actors/services ("sequenceDiagram").
  - erDiagram: the core data model with 3-6 entities, keys (PK/FK) and relationships ("erDiagram").
  - stateDiagram: the lifecycle of the central domain entity ("stateDiagram-v2").
- Mermaid syntax must be valid: no special chars in node labels, wrap labels containing spaces in quotes, and keep each diagram to a readable size (roughly 6-14 nodes/steps).`;

type RawResult = Omit<AnalysisResult, 'tickets' | 'estimate'> & {
  tickets: Omit<Ticket, 'effortPoints' | 'hours'>[];
  assumptions: AnalysisResult['assumptions'];
  milestones: AnalysisResult['milestones'];
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

  const ts = parsed.techStack ?? {};
  parsed.techStack = {
    frontend:   ts.frontend   ?? [],
    backend:    ts.backend    ?? [],
    database:   ts.database   ?? [],
    devops:     ts.devops     ?? [],
    thirdParty: ts.thirdParty ?? [],
  };
  parsed.assumptions = parsed.assumptions ?? [];
  parsed.milestones = parsed.milestones ?? [];

  const { tickets, estimate } = estimateTickets(parsed.tickets ?? []);
  return { ...parsed, tickets, estimate };
}

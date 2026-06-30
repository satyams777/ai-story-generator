import type { AnalysisResult } from '@/types/analysis';
import AIChat from '@/components/AIChat';

const SUGGESTIONS = [
  'What is the MVP scope for this project?',
  'Which user story has the highest risk?',
  'What are the top 3 technical challenges?',
  'Suggest a phased rollout plan.',
  'Which features should be cut for a 4-week deadline?',
];

function buildContext(result: AnalysisResult): string {
  const stories = result.userStories
    .map((s) => `- ${s.id}: As a ${s.actor}, I want to ${s.goal}`)
    .join('\n');
  const risks = result.risks
    .map((r) => `- [${r.impact} impact, ${r.probability ?? 'Medium'} probability] ${r.description}`)
    .join('\n');
  const stack = Object.values(result.techStack)
    .flat()
    .map((i) => i.name)
    .join(', ');

  return `You are an expert business analyst assistant. Answer questions about the project below concisely and specifically.

Project Summary:
${result.summary.slice(0, 600)}

User Stories:
${stories}

Key Risks:
${risks}

Recommended Tech Stack: ${stack}

Effort Estimate: ${result.estimate.totalHours} hours, ${result.estimate.timelineWeeks} weeks.`;
}

interface Props {
  result: AnalysisResult;
}

export default function ChatTab({ result }: Props) {
  return (
    <AIChat
      systemContext={buildContext(result)}
      suggestions={SUGGESTIONS}
      emptyTitle="Ask anything about this project"
      emptySubtitle="I have full context — requirements, risks, estimates, and tech stack."
    />
  );
}

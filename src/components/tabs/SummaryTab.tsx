import type { AnalysisResult, Priority } from '@/types/analysis';
import RiskMatrix from '@/components/RiskMatrix';
import TechStackCards from '@/components/TechStackCards';

const PRIORITY_STYLES: Record<Priority, string> = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low:    'bg-green-100 text-green-700',
};

interface Props {
  result: AnalysisResult;
}

export default function SummaryTab({ result }: Props) {
  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <Card title="Executive Summary">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{result.summary}</p>
      </Card>

      {/* Actors */}
      <Card title="Actors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.actors.map((actor) => (
            <div key={actor.name} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">{actor.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{actor.role}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Tech Stack */}
      {result.techStack && (
        <Card title="Recommended Tech Stack">
          <TechStackCards techStack={result.techStack} />
        </Card>
      )}

      {/* Functional Requirements */}
      <Card title="Functional Requirements">
        <RequirementList items={result.functionalRequirements} />
      </Card>

      {/* Non-Functional Requirements */}
      <Card title="Non-Functional Requirements">
        <RequirementList items={result.nonFunctionalRequirements} />
      </Card>

      {/* Risk Matrix */}
      <Card title="Risk Assessment">
        <RiskMatrix risks={result.risks} />
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function RequirementList({ items }: { items: AnalysisResult['functionalRequirements'] }) {
  return (
    <ul className="space-y-2">
      {items.map((req) => (
        <li key={req.id} className="flex items-start gap-3">
          <span className="shrink-0 font-mono text-xs text-gray-400 mt-1 w-12">{req.id}</span>
          <span className="flex-1 text-gray-700 text-sm">{req.description}</span>
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[req.priority]}`}>
            {req.priority}
          </span>
        </li>
      ))}
    </ul>
  );
}

import type { AnalysisResult, Priority } from '@/types/analysis';
import RiskMatrix from '@/components/RiskMatrix';
import TechStackCards from '@/components/TechStackCards';

const PRIORITY_STYLES: Record<Priority, string> = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low:    'bg-green-100 text-green-700',
};

const ASSUMPTION_CAT_STYLES: Record<string, string> = {
  Technical: 'bg-blue-100 text-blue-700',
  Business:  'bg-emerald-100 text-emerald-700',
  Scope:     'bg-purple-100 text-purple-700',
  Timeline:  'bg-amber-100 text-amber-700',
};

const PHASE_COLORS = ['border-blue-400 bg-blue-50', 'border-purple-400 bg-purple-50', 'border-emerald-400 bg-emerald-50'];
const PHASE_HEADER = ['text-blue-700', 'text-purple-700', 'text-emerald-700'];

interface Props {
  result: AnalysisResult;
}

export default function SummaryTab({ result }: Props) {
  const assumptions = result.assumptions ?? [];
  const milestones = result.milestones ?? [];

  return (
    <div className="space-y-8">
      <Card title="Executive Summary">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{result.summary}</p>
      </Card>

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

      {milestones.length > 0 && (
        <Card title="Project Milestones">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {milestones.map((m, idx) => (
              <div key={m.id} className={`rounded-xl border-l-4 p-4 ${PHASE_COLORS[idx] ?? PHASE_COLORS[2]}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${PHASE_HEADER[idx] ?? PHASE_HEADER[2]}`}>Phase {m.phase}</p>
                <p className="font-semibold text-gray-900">{m.name}</p>
                <p className="text-sm text-gray-500 mt-1">{m.description}</p>
                <p className="text-xs text-gray-400 mt-2">{m.ticketIds.length} tickets</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {result.techStack && (
        <Card title="Recommended Tech Stack">
          <TechStackCards techStack={result.techStack} />
        </Card>
      )}

      <Card title="Functional Requirements">
        <RequirementList items={result.functionalRequirements} />
      </Card>

      <Card title="Non-Functional Requirements">
        <RequirementList items={result.nonFunctionalRequirements} />
      </Card>

      <Card title="Risk Assessment">
        <RiskMatrix risks={result.risks} />
      </Card>

      {assumptions.length > 0 && (
        <Card title="Assumption Log">
          <div className="space-y-2">
            {assumptions.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <span className="shrink-0 font-mono text-xs text-gray-400 mt-0.5 w-10">{a.id}</span>
                <p className="flex-1 text-sm text-gray-700">{a.description}</p>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${ASSUMPTION_CAT_STYLES[a.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {a.category}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-6">
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

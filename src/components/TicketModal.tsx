'use client';

import { useEffect } from 'react';
import type { Ticket, TicketType, UserStory } from '@/types/analysis';

const TYPE_STYLES: Record<TicketType, { badge: string; bar: string; label: string }> = {
  Frontend: { badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500', label: 'Frontend' },
  Backend:  { badge: 'bg-green-100 text-green-700', bar: 'bg-green-500', label: 'Backend' },
  QA:       { badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500', label: 'QA' },
  DevOps:   { badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500', label: 'DevOps' },
};

const IMPL_HINTS: Record<TicketType, string[]> = {
  Frontend: ['Create responsive UI component with Tailwind CSS', 'Handle loading and error states', 'Write unit tests with React Testing Library'],
  Backend:  ['Define API contract (request/response schema)', 'Add input validation and error handling', 'Write integration tests against the endpoint'],
  QA:       ['Write test cases covering happy path and edge cases', 'Set up test data fixtures', 'Automate with Playwright or Cypress'],
  DevOps:   ['Update CI/CD pipeline configuration', 'Document environment variables and secrets required', 'Verify rollback strategy'],
};

interface Props {
  ticket: Ticket;
  story: UserStory | undefined;
  onClose: () => void;
}

export default function TicketModal({ ticket, story, onClose }: Props) {
  const style = TYPE_STYLES[ticket.type];
  const hints = IMPL_HINTS[ticket.type];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Colour bar */}
        <div className={`h-1.5 w-full ${style.bar}`} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
              {ticket.type}
            </span>
            <span className="font-mono text-sm text-gray-400">{ticket.id}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900 leading-snug">{ticket.title}</h2>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-3">
            <Meta label="Story" value={ticket.storyId} />
            <Meta label="Story Points" value={String(ticket.effortPoints)} />
            <Meta label="Estimated Hours" value={`${ticket.hours}h`} />
          </div>

          {/* Implementation hints */}
          <Section title="Implementation Checklist">
            <ul className="space-y-2">
              {hints.map((hint, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-400">
                    {i + 1}
                  </span>
                  {hint}
                </li>
              ))}
            </ul>
          </Section>

          {/* Linked user story */}
          {story ? (
            <Section title={`Linked User Story — ${story.id}`}>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 space-y-3">
                <p className="text-sm text-gray-800">
                  As a <span className="font-semibold text-brand-600">{story.actor}</span>, I want to{' '}
                  <span className="font-semibold">{story.goal}</span>, so that {story.benefit}.
                </p>

                {story.acceptanceCriteria.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Acceptance Criteria
                    </p>
                    <ul className="space-y-1.5">
                      {story.acceptanceCriteria.map((ac, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="shrink-0 text-green-500 mt-0.5">✓</span>
                          {ac}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          ) : (
            <Section title="Linked User Story">
              <p className="text-sm text-gray-400">No linked story found for {ticket.storyId}.</p>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

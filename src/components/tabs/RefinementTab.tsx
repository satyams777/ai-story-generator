'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/types/analysis';

type Section =
  | 'summary'
  | 'techStack'
  | 'risks'
  | 'assumptions'
  | 'userStories'
  | 'functionalRequirements'
  | 'nonFunctionalRequirements';

const SECTIONS: { value: Section; label: string; icon: string; hint: string }[] = [
  { value: 'summary',                  label: 'Executive Summary',          icon: '📋', hint: 'e.g. "Make it more investor-focused" or "Add emphasis on security"' },
  { value: 'techStack',                label: 'Tech Stack',                 icon: '🛠️', hint: 'e.g. "Use open-source tools only" or "Optimize for mobile-first"' },
  { value: 'risks',                    label: 'Risk Assessment',            icon: '⚠️', hint: 'e.g. "Add GDPR compliance risks" or "Focus on security threats"' },
  { value: 'assumptions',              label: 'Assumption Log',             icon: '💡', hint: 'e.g. "Add more timeline assumptions" or "Include vendor availability"' },
  { value: 'userStories',              label: 'User Stories',               icon: '📖', hint: 'e.g. "Add admin user stories" or "Make acceptance criteria more detailed"' },
  { value: 'functionalRequirements',   label: 'Functional Requirements',    icon: '✅', hint: 'e.g. "Add real-time sync requirements" or "Include accessibility features"' },
  { value: 'nonFunctionalRequirements',label: 'Non-Functional Requirements',icon: '⚙️', hint: 'e.g. "Add strict performance SLAs" or "Include HIPAA requirements"' },
];

interface RefinementEntry {
  section: Section;
  instruction: string;
  timestamp: string;
  applied: boolean;
}

interface Props {
  result: AnalysisResult;
  projectId: string;
  onSectionUpdate: (section: Section, data: unknown) => void;
}

export default function RefinementTab({ result, projectId, onSectionUpdate }: Props) {
  const [section, setSection] = useState<Section>('summary');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RefinementEntry[]>([]);
  const [preview, setPreview] = useState<unknown | null>(null);

  const activeSectionDef = SECTIONS.find((s) => s.value === section)!;

  async function handleRefine() {
    if (!instruction.trim() || loading) return;
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          instruction: instruction.trim(),
          currentContent: result[section],
          projectSummary: result.summary.slice(0, 600),
          projectId,
        }),
      });

      const json = (await res.json()) as { data?: Record<string, unknown>; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Refinement failed');

      const updated = json.data?.[section];
      if (updated === undefined) throw new Error('AI returned unexpected structure');

      setPreview(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refinement failed');
    } finally {
      setLoading(false);
    }
  }

  function applyPreview() {
    if (preview === undefined || preview === null) return;
    onSectionUpdate(section, preview);
    setHistory((h) => [
      { section, instruction, timestamp: new Date().toLocaleTimeString(), applied: true },
      ...h,
    ]);
    setPreview(null);
    setInstruction('');
  }

  function discardPreview() {
    setPreview(null);
  }

  const QUICK_PROMPTS: Partial<Record<Section, string[]>> = {
    summary: ['Make it more investor-focused', 'Shorten to a single paragraph', 'Emphasize security and compliance'],
    techStack: ['Use open-source tools only', 'Optimize for mobile-first', 'Suggest a serverless architecture', 'Use AWS-native services'],
    risks: ['Add data privacy and GDPR risks', 'Include third-party dependency risks', 'Focus on security vulnerabilities'],
    assumptions: ['Add vendor availability assumptions', 'Include budget constraint assumptions', 'Add regulatory approval timeline'],
    userStories: ['Add admin role user stories', 'Make acceptance criteria more detailed', 'Add edge-case stories for error handling'],
    functionalRequirements: ['Add real-time notifications requirement', 'Include audit logging', 'Add multi-language support requirement'],
    nonFunctionalRequirements: ['Add strict performance SLAs (< 200ms)', 'Include HIPAA compliance requirements', 'Add 99.99% uptime requirement'],
  };

  const quickPrompts = QUICK_PROMPTS[section] ?? [];

  function renderPreview(data: unknown): React.ReactNode {
    if (typeof data === 'string') {
      return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{data}</p>;
    }
    if (Array.isArray(data)) {
      return (
        <ul className="space-y-2">
          {(data as Record<string, unknown>[]).map((item, i) => (
            <li key={i} className="text-sm text-gray-700 border-l-2 border-brand-300 pl-3 py-1">
              {typeof item === 'object' ? (
                <div className="space-y-0.5">
                  {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                    <div key={k}><span className="font-medium text-gray-500 text-xs uppercase">{k}:</span> <span>{String(v)}</span></div>
                  ))}
                </div>
              ) : String(item)}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="space-y-3">
          {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
            <div key={k}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{k}</p>
              {renderPreview(v)}
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-sm text-gray-700">{String(data)}</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-5">
        <h2 className="text-lg font-semibold text-brand-800 mb-1">AI Section Refinement</h2>
        <p className="text-sm text-brand-600">
          Select any section and describe what you want changed. The AI will regenerate just that section —
          you can preview the result before applying it to your dashboard.
        </p>
      </div>

      {/* Section picker */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">1. Choose section to refine</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => { setSection(s.value); setPreview(null); setError(null); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                  section === s.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-400'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{s.icon}</span>
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            2. Describe what to change
          </label>
          {quickPrompts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => setInstruction(q)}
                  className="text-xs px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-600 hover:bg-brand-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={activeSectionDef.hint}
            rows={3}
            className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
        )}

        <button
          onClick={handleRefine}
          disabled={!instruction.trim() || loading}
          className="w-full py-3 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Refining with AI…
            </>
          ) : (
            <>✨ Refine {activeSectionDef.label}</>
          )}
        </button>
      </div>

      {/* Preview */}
      {preview !== null && (
        <div className="rounded-xl bg-white border-2 border-brand-400 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeSectionDef.icon}</span>
              <h3 className="font-semibold text-gray-900">Preview: Refined {activeSectionDef.label}</h3>
              <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">New version</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 max-h-72 overflow-y-auto mb-4">
            {renderPreview(preview)}
          </div>

          <div className="flex gap-3">
            <button
              onClick={applyPreview}
              className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
            >
              Apply to Dashboard
            </button>
            <button
              onClick={discardPreview}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleRefine}
              className="px-4 py-2.5 rounded-lg border border-brand-200 text-brand-600 font-medium hover:bg-brand-50 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Refinement History</h3>
          <div className="space-y-2">
            {history.map((entry, i) => {
              const def = SECTIONS.find((s) => s.value === entry.section);
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-lg">{def?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{def?.label}</p>
                    <p className="text-xs text-gray-500 truncate">{entry.instruction}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Applied</span>
                    <p className="text-xs text-gray-400 mt-1">{entry.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

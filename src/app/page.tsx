'use client';

import { useState } from 'react';
import type { AnalysisResult, Role } from '@/types/analysis';
import FileUpload from '@/components/FileUpload';
import Dashboard from '@/components/Dashboard';
import ProjectsList from '@/components/ProjectsList';
import { INDUSTRY_TEMPLATES } from '@/lib/templates';
import type { JiraTarget } from '@/components/JiraModal';

type Status = 'projects' | 'idle' | 'loading' | 'done' | 'error';

export default function Home() {
  const [status, setStatus]           = useState<Status>('projects');
  const [result, setResult]           = useState<AnalysisResult | null>(null);
  const [projectId, setProjectId]     = useState<string | null>(null);
  const [projectRole, setProjectRole] = useState<Role>('owner');
  const [jiraTarget, setJiraTarget]   = useState<JiraTarget | null>(null);
  const [hoursPerPoint, setHoursPerPoint] = useState(4);
  const [error, setError]             = useState<string | null>(null);
  const [templateText, setTemplateText] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [openingProjectId, setOpeningProjectId] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = (await res.json()) as AnalysisResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      // Auto-save the freshly analyzed project so it survives a refresh.
      const saveRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: data, hoursPerPoint: 4 }),
      });
      const saved = await saveRes.json();

      setResult(data);
      setProjectId(saveRes.ok ? saved.id : null);
      setProjectRole('owner');
      setJiraTarget(null);
      setHoursPerPoint(4);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  async function handleOpenProject(id: string) {
    setOpeningProjectId(id);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Could not load project');
      const data = await res.json();
      setResult(data.result);
      setHoursPerPoint(data.hoursPerPoint ?? 4);
      setProjectId(data.id);
      setProjectRole((data.role as Role) ?? 'stakeholder');
      setJiraTarget(data.jiraTarget ?? null);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load project');
      setStatus('error');
    } finally {
      setOpeningProjectId(null);
    }
  }

  function handleReset() {
    setStatus('projects');
    setResult(null);
    setProjectId(null);
    setProjectRole('owner');
    setJiraTarget(null);
    setError(null);
    setTemplateText('');
    setActiveTemplate(null);
  }

  function handleNewAnalysis() {
    setStatus('idle');
    setError(null);
    setTemplateText('');
    setActiveTemplate(null);
  }

  function handleResultUpdate(updated: AnalysisResult) {
    setResult(updated);
  }

  function loadTemplate(id: string, text: string) {
    setActiveTemplate(id);
    setTemplateText(text);
  }

  if (status === 'projects') {
    return (
      <ProjectsList
        onNewAnalysis={handleNewAnalysis}
        onOpenProject={handleOpenProject}
        loadingProjectId={openingProjectId}
      />
    );
  }

  if (status === 'done' && result) {
    return (
      <Dashboard
        result={result}
        onReset={handleReset}
        onResultUpdate={handleResultUpdate}
        projectId={projectId}
        initialHoursPerPoint={hoursPerPoint}
        initialRole={projectRole}
        initialJiraTarget={jiraTarget}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-14">
      <div className="w-full max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <button
            onClick={handleReset}
            className="mb-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back to My Projects
          </button>
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 text-sm font-medium text-brand-600 mb-4">
            <span>✨</span> AI-powered project planning
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">AI Business Analyst</h1>
          <p className="text-gray-500 text-lg">
            Upload requirements or pick an industry template — get a full project plan with sprint board, team cost calculator, and PDF export in under 2 minutes.
          </p>
        </div>

        {status === 'error' && error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
        )}

        {/* Industry template picker */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-600 mb-3">
            Quick start with an industry template
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INDUSTRY_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => loadTemplate(tpl.id, tpl.text)}
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                  activeTemplate === tpl.id
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-400'
                    : `${tpl.accent} hover:opacity-90`
                }`}
              >
                <span className="text-2xl shrink-0">{tpl.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{tpl.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{tpl.description}</p>
                </div>
              </button>
            ))}
          </div>
          {activeTemplate && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-brand-600 font-medium">
                ✓ Template loaded — scroll down to customize or click Analyze
              </span>
              <button onClick={() => { setActiveTemplate(null); setTemplateText(''); }} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-gray-400 text-xs mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          or upload / paste your own requirements
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <FileUpload
          key={activeTemplate ?? 'none'}
          onSubmit={handleSubmit}
          loading={status === 'loading'}
          defaultText={templateText}
        />

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {[
            { icon: '🎭', text: 'Multi-role views' },
            { icon: '🏃', text: 'Sprint planner' },
            { icon: '✨', text: 'AI section refinement' },
            { icon: '📄', text: 'PDF export' },
            { icon: '💬', text: 'AI chat assistant' },
          ].map((f) => (
            <span key={f.text} className="inline-flex items-center gap-1.5 text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-3 py-1.5">
              <span>{f.icon}</span>{f.text}
            </span>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Accepts PDF, DOCX, or plain text &bull; Powered by Llama 3.3 via Groq
        </p>
      </div>
    </main>
  );
}

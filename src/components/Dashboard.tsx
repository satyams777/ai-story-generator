'use client';

import { useState, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import type { AnalysisResult, Ticket, Estimate, Role } from '@/types/analysis';
import SummaryTab from '@/components/tabs/SummaryTab';
import UserStoriesTab from '@/components/tabs/UserStoriesTab';
import TasksTab from '@/components/tabs/TasksTab';
import EstimatesTab from '@/components/tabs/EstimatesTab';
import DiagramsTab from '@/components/tabs/DiagramsTab';
import ChatTab from '@/components/tabs/ChatTab';
import SprintTab from '@/components/tabs/SprintTab';
import RefinementTab from '@/components/tabs/RefinementTab';
import ShareProjectModal from '@/components/ShareProjectModal';
import JiraModal, { type JiraTarget } from '@/components/JiraModal';

type Tab = 'summary' | 'stories' | 'tasks' | 'estimates' | 'sprint' | 'team' | 'diagrams' | 'refine' | 'chat';
type Group = 'Plan' | 'Build' | 'AI Tools';

interface TabDef { id: Tab; label: string; icon: string; roles: Role[]; group: Group; badge?: string; }

const ALL_TABS: TabDef[] = [
  { id: 'summary',   label: 'Summary',      icon: '📋', group: 'Plan',     roles: ['owner', 'stakeholder', 'developer', 'pm'] },
  { id: 'stories',   label: 'User Stories', icon: '📖', group: 'Plan',     roles: ['owner', 'pm'] },
  { id: 'estimates', label: 'Estimates',    icon: '📊', group: 'Plan',     roles: ['owner', 'pm'] },
  { id: 'tasks',     label: 'Tasks',        icon: '✅', group: 'Build',    roles: ['owner', 'developer', 'pm'] },
  { id: 'sprint',    label: 'Sprint Plan',  icon: '🏃', group: 'Build',    roles: ['owner', 'developer', 'pm'] },
  { id: 'diagrams',  label: 'Diagrams',     icon: '🗺️', group: 'Build',    roles: ['owner', 'stakeholder', 'developer', 'pm'] },
  { id: 'refine',    label: 'Refine AI',    icon: '✨', group: 'AI Tools', roles: ['owner'], badge: 'NEW' },
  { id: 'chat',      label: 'AI Chat',      icon: '💬', group: 'AI Tools', roles: ['owner', 'stakeholder', 'developer', 'pm'], badge: 'AI' },
];

const GROUP_ORDER: Group[] = ['Plan', 'Build', 'AI Tools'];

const ROLE_DEFS: { id: Role; label: string; icon: string; description: string; color: string }[] = [
  { id: 'owner',      label: 'Owner / BA',        icon: '🧑‍💼', description: 'Full access · Can refine AI output', color: 'bg-brand-50 border-brand-300 text-brand-700' },
  { id: 'pm',         label: 'Product Manager',   icon: '📋',   description: 'Planning, stories & cost view',      color: 'bg-purple-50 border-purple-300 text-purple-700' },
  { id: 'developer',  label: 'Developer',         icon: '🧑‍💻', description: 'Tasks, sprint & diagrams only',      color: 'bg-green-50 border-green-300 text-green-700' },
  { id: 'stakeholder',label: 'Stakeholder',       icon: '👀',   description: 'Read-only: summary & diagrams',      color: 'bg-amber-50 border-amber-300 text-amber-700' },
];

const WEEKLY_CAPACITY = 40;

function buildEstimate(tickets: Ticket[], hpp: number): Estimate {
  const breakdown = { frontend: 0, backend: 0, qa: 0, devops: 0 };
  let totalPoints = 0;
  for (const t of tickets) {
    const key = t.type.toLowerCase() as keyof typeof breakdown;
    totalPoints += t.effortPoints;
    breakdown[key] += t.effortPoints * hpp;
  }
  const totalHours = totalPoints * hpp;
  return { totalHours, totalPoints, timelineWeeks: Math.ceil(totalHours / WEEKLY_CAPACITY), breakdown };
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
  onResultUpdate: (updated: AnalysisResult) => void;
  projectId?: string | null;
  initialHoursPerPoint?: number;
  initialRole?: Role;
  initialJiraTarget?: JiraTarget | null;
}

export default function Dashboard({ result, onReset, onResultUpdate, projectId, initialHoursPerPoint, initialRole, initialJiraTarget }: Props) {
  const isOwner = (initialRole ?? 'owner') === 'owner';

  const [activeTab, setActiveTab]         = useState<Tab>('summary');
  const [role, setRole]                   = useState<Role>(initialRole ?? 'owner');
  const [showRoleMenu, setShowRoleMenu]   = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [jiraTarget, setJiraTarget]       = useState<JiraTarget | null>(initialJiraTarget ?? null);
  const [mobileNav, setMobileNav]         = useState(false);
  const [tickets, setTickets]             = useState<Ticket[]>(result.tickets.map((t) => ({ ...t })));
  const [hoursPerPoint, setHoursPerPoint] = useState(initialHoursPerPoint ?? 4);
  const [saveStatus, setSaveStatus]       = useState<SaveStatus>('idle');

  const liveTickets = useMemo(
    () => tickets.map((t) => ({ ...t, hours: t.effortPoints * hoursPerPoint })),
    [tickets, hoursPerPoint],
  );
  const liveEstimate = useMemo(() => buildEstimate(tickets, hoursPerPoint), [tickets, hoursPerPoint]);

  const visibleTabs = ALL_TABS.filter((t) => t.roles.includes(role));

  // If current tab is hidden for new role, switch to first visible
  const safeTab = visibleTabs.find((t) => t.id === activeTab)?.id ?? visibleTabs[0]?.id ?? 'summary';
  const activeLabel = visibleTabs.find((t) => t.id === safeTab)?.label ?? 'Summary';

  function switchRole(r: Role) {
    setRole(r);
    setShowRoleMenu(false);
  }

  function selectTab(id: Tab) {
    setActiveTab(id);
    setMobileNav(false);
  }

  function handleExport() {
    try {
      localStorage.setItem('ba_export_data', JSON.stringify({ ...result, tickets: liveTickets, estimate: liveEstimate }));
      window.open('/export', '_blank');
    } catch {
      window.open('/export', '_blank');
    }
  }

  function handleSectionUpdate(section: string, data: unknown) {
    onResultUpdate({ ...result, [section]: data });
  }

  async function handleSave() {
    if (!projectId) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: { ...result, tickets: liveTickets, estimate: liveEstimate },
          hoursPerPoint,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }

  async function handlePushToJira(ticketIds: string[]) {
    if (!projectId) return [];
    const res = await fetch('/api/jira/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appProjectId: projectId, ticketIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Push to Jira failed');

    const results = data.results as { ticketId: string; ok: boolean; jiraKey?: string; jiraUrl?: string; error?: string }[];
    setTickets((prev) => prev.map((t) => {
      const r = results.find((res) => res.ticketId === t.id);
      return r?.ok ? { ...t, jiraKey: r.jiraKey, jiraUrl: r.jiraUrl } : t;
    }));
    return results;
  }

  const activeRoleDef = ROLE_DEFS.find((r) => r.id === role)!;

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Brand + My projects */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧠</span>
          <span className="text-sm font-semibold text-gray-900">Project Analysis</span>
        </div>
        <button
          onClick={onReset}
          className="w-full text-left text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5"
        >
          ← My Projects
        </button>
      </div>

      {/* Grouped nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {GROUP_ORDER.map((group) => {
          const items = visibleTabs.filter((t) => t.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{group}</p>
              <div className="space-y-0.5">
                {items.map((tab) => {
                  const active = safeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => selectTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="w-5 text-center">{tab.icon}</span>
                      <span className="flex-1 text-left">{tab.label}</span>
                      {tab.badge && (
                        <span className="text-[10px] bg-brand-100 text-brand-600 font-semibold px-1.5 py-0.5 rounded-full">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Role picker + export */}
      <div className="border-t border-gray-100 p-3 space-y-2">
        {isOwner ? (
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu((v) => !v)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${activeRoleDef.color}`}
            >
              <span>{activeRoleDef.icon}</span>
              <span className="flex-1 text-left truncate">Preview: {activeRoleDef.label}</span>
              <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
              </svg>
            </button>

            {showRoleMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(false)} />
                <div className="absolute left-0 bottom-full mb-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">Preview as…</p>
                  {ROLE_DEFS.map((rd) => (
                    <button
                      key={rd.id}
                      onClick={() => switchRole(rd.id)}
                      className={`w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-gray-50 transition-colors ${role === rd.id ? 'bg-brand-50' : ''}`}
                    >
                      <span className="text-xl shrink-0">{rd.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{rd.label}</p>
                        <p className="text-xs text-gray-500">{rd.description}</p>
                      </div>
                      {role === rd.id && <span className="ml-auto text-brand-600">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${activeRoleDef.color}`}>
            <span>{activeRoleDef.icon}</span>
            <span className="flex-1 text-left truncate">{activeRoleDef.label}</span>
          </div>
        )}

        {isOwner && projectId && (
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>👥</span>
            <span>Share Project</span>
          </button>
        )}

        {isOwner && projectId && (
          <button
            onClick={() => setShowJiraModal(true)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>🔗</span>
            <span>{jiraTarget ? `Jira: ${jiraTarget.jiraProjectKey}` : 'Connect Jira'}</span>
          </button>
        )}

        {projectId && role !== 'stakeholder' && (
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{saveStatus === 'saved' ? '✅' : '💾'}</span>
            <span>
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Retry save' : 'Save Changes'}
            </span>
          </button>
        )}

        <button
          onClick={handleExport}
          className="w-full px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <span>📄</span>
          <span>Export Report</span>
        </button>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="no-print lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNav(false)} />
          <aside className="relative w-64 max-w-[80%] bg-white h-full shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="no-print lg:hidden bg-white border-b border-gray-200 sticky top-0 z-20 flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900">{activeLabel}</span>
        </header>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {safeTab === 'summary'   && <SummaryTab result={result} />}
          {safeTab === 'stories'   && <UserStoriesTab stories={result.userStories} />}
          {safeTab === 'tasks'     && (
            <TasksTab
              tickets={liveTickets}
              userStories={result.userStories}
              role={role}
              onTicketsChange={setTickets}
              jiraTarget={jiraTarget}
              onPushToJira={projectId ? handlePushToJira : undefined}
            />
          )}
          {safeTab === 'estimates' && (
            <EstimatesTab
              estimate={liveEstimate}
              initialEstimate={result.estimate}
              tickets={liveTickets}
              hoursPerPoint={hoursPerPoint}
              onTicketsChange={setTickets}
              onHoursPerPointChange={setHoursPerPoint}
              onReset={() => { setTickets(result.tickets.map((t) => ({ ...t }))); setHoursPerPoint(4); }}
            />
          )}
          {safeTab === 'sprint'    && (
            <SprintTab
              tickets={liveTickets}
              milestones={result.milestones ?? []}
              timelineWeeks={liveEstimate.timelineWeeks}
            />
          )}
          {safeTab === 'diagrams'  && (
            <DiagramsTab
              diagrams={result.diagrams}
              userStories={result.userStories}
              tickets={liveTickets}
              hoursPerPoint={hoursPerPoint}
            />
          )}
          {safeTab === 'refine' && projectId && (
            <RefinementTab
              result={result}
              projectId={projectId}
              onSectionUpdate={handleSectionUpdate}
            />
          )}
          {safeTab === 'chat'      && <ChatTab result={result} />}
        </main>
      </div>

      {showShareModal && projectId && (
        <ShareProjectModal projectId={projectId} onClose={() => setShowShareModal(false)} />
      )}

      {showJiraModal && projectId && (
        <JiraModal
          projectId={projectId}
          currentTarget={jiraTarget}
          onTargetChange={setJiraTarget}
          onClose={() => setShowJiraModal(false)}
        />
      )}
    </div>
  );
}

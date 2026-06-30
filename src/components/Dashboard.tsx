'use client';

import { useState, useMemo } from 'react';
import type { AnalysisResult, Ticket, Estimate, Role } from '@/types/analysis';
import SummaryTab from '@/components/tabs/SummaryTab';
import UserStoriesTab from '@/components/tabs/UserStoriesTab';
import TasksTab from '@/components/tabs/TasksTab';
import EstimatesTab from '@/components/tabs/EstimatesTab';
import DiagramsTab from '@/components/tabs/DiagramsTab';
import ChatTab from '@/components/tabs/ChatTab';
import SprintTab from '@/components/tabs/SprintTab';
import RefinementTab from '@/components/tabs/RefinementTab';

type Tab = 'summary' | 'stories' | 'tasks' | 'estimates' | 'sprint' | 'team' | 'diagrams' | 'refine' | 'chat';

interface TabDef { id: Tab; label: string; icon: string; roles: Role[]; badge?: string; }

const ALL_TABS: TabDef[] = [
  { id: 'summary',   label: 'Summary',      icon: '📋', roles: ['owner', 'stakeholder', 'developer', 'pm'] },
  { id: 'stories',   label: 'User Stories', icon: '📖', roles: ['owner', 'pm'] },
  { id: 'tasks',     label: 'Tasks',        icon: '✅', roles: ['owner', 'developer', 'pm'] },
  { id: 'estimates', label: 'Estimates',    icon: '📊', roles: ['owner', 'pm'] },
  { id: 'sprint',    label: 'Sprint Plan',  icon: '🏃', roles: ['owner', 'developer', 'pm'] },
  { id: 'diagrams',  label: 'Diagrams',     icon: '🗺️', roles: ['owner', 'stakeholder', 'developer', 'pm'] },
  { id: 'refine',    label: 'Refine AI',    icon: '✨', roles: ['owner'], badge: 'NEW' },
  { id: 'chat',      label: 'AI Chat',      icon: '💬', roles: ['owner', 'stakeholder', 'developer', 'pm'], badge: 'AI' },
];

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

interface Props {
  result: AnalysisResult;
  onReset: () => void;
  onResultUpdate: (updated: AnalysisResult) => void;
}

export default function Dashboard({ result, onReset, onResultUpdate }: Props) {
  const [activeTab, setActiveTab]         = useState<Tab>('summary');
  const [role, setRole]                   = useState<Role>('owner');
  const [showRoleMenu, setShowRoleMenu]   = useState(false);
  const [tickets, setTickets]             = useState<Ticket[]>(result.tickets.map((t) => ({ ...t })));
  const [hoursPerPoint, setHoursPerPoint] = useState(4);

  const liveTickets = useMemo(
    () => tickets.map((t) => ({ ...t, hours: t.effortPoints * hoursPerPoint })),
    [tickets, hoursPerPoint],
  );
  const liveEstimate = useMemo(() => buildEstimate(tickets, hoursPerPoint), [tickets, hoursPerPoint]);

  const visibleTabs = ALL_TABS.filter((t) => t.roles.includes(role));

  // If current tab is hidden for new role, switch to first visible
  const safeTab = visibleTabs.find((t) => t.id === activeTab)?.id ?? visibleTabs[0]?.id ?? 'summary';

  function switchRole(r: Role) {
    setRole(r);
    setShowRoleMenu(false);
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

  const activeRoleDef = ROLE_DEFS.find((r) => r.id === role)!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="no-print bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onReset} className="text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0">
              ← New Analysis
            </button>
            <h1 className="text-base font-semibold text-gray-900 hidden sm:block">Project Analysis</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Role picker */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu((v) => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${activeRoleDef.color}`}
              >
                <span>{activeRoleDef.icon}</span>
                <span className="hidden sm:inline">{activeRoleDef.label}</span>
                <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                </svg>
              </button>

              {showRoleMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">Switch Role</p>
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

            {/* Export */}
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-1.5"
            >
              <span>📄</span>
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-0.5 overflow-x-auto no-print">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                safeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className="ml-0.5 text-xs bg-brand-100 text-brand-600 font-semibold px-1.5 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {safeTab === 'summary'   && <SummaryTab result={result} />}
        {safeTab === 'stories'   && <UserStoriesTab stories={result.userStories} />}
        {safeTab === 'tasks'     && (
          <TasksTab
            tickets={liveTickets}
            userStories={result.userStories}
            role={role}
            onTicketsChange={setTickets}
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
        {safeTab === 'refine'    && (
          <RefinementTab
            result={result}
            onSectionUpdate={handleSectionUpdate}
          />
        )}
        {safeTab === 'chat'      && <ChatTab result={result} />}
      </main>
    </div>
  );
}

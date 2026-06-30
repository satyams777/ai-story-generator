'use client';

import { useState, useMemo } from 'react';
import type { AnalysisResult, Ticket, Estimate } from '@/types/analysis';
import SummaryTab from '@/components/tabs/SummaryTab';
import UserStoriesTab from '@/components/tabs/UserStoriesTab';
import TasksTab from '@/components/tabs/TasksTab';
import EstimatesTab from '@/components/tabs/EstimatesTab';
import DiagramsTab from '@/components/tabs/DiagramsTab';
import ChatTab from '@/components/tabs/ChatTab';

type Tab = 'summary' | 'stories' | 'tasks' | 'estimates' | 'diagrams' | 'chat';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'summary',   label: 'Summary',      icon: '📋' },
  { id: 'stories',   label: 'User Stories', icon: '📖' },
  { id: 'tasks',     label: 'Tasks',        icon: '✅' },
  { id: 'estimates', label: 'Estimates',    icon: '📊' },
  { id: 'diagrams',  label: 'Diagrams',     icon: '🗺️' },
  { id: 'chat',      label: 'AI Chat',      icon: '💬' },
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
}

export default function Dashboard({ result, onReset }: Props) {
  const [activeTab, setActiveTab]         = useState<Tab>('summary');
  const [tickets, setTickets]             = useState<Ticket[]>(result.tickets.map((t) => ({ ...t })));
  const [hoursPerPoint, setHoursPerPoint] = useState(4);

  const liveTickets = useMemo(
    () => tickets.map((t) => ({ ...t, hours: t.effortPoints * hoursPerPoint })),
    [tickets, hoursPerPoint]
  );

  const liveEstimate = useMemo(() => buildEstimate(tickets, hoursPerPoint), [tickets, hoursPerPoint]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="no-print bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onReset} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              ← New Analysis
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Project Analysis</h1>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Export PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto no-print">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === 'chat' && (
                <span className="ml-1 text-xs bg-brand-100 text-brand-600 font-semibold px-1.5 py-0.5 rounded-full">AI</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'summary'   && <SummaryTab result={result} />}
        {activeTab === 'stories'   && <UserStoriesTab stories={result.userStories} />}
        {activeTab === 'tasks'     && <TasksTab tickets={liveTickets} userStories={result.userStories} />}
        {activeTab === 'estimates' && (
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
        {activeTab === 'diagrams'  && (
          <DiagramsTab
            diagrams={result.diagrams}
            userStories={result.userStories}
            tickets={liveTickets}
            hoursPerPoint={hoursPerPoint}
          />
        )}
        {activeTab === 'chat'      && <ChatTab result={result} />}
      </main>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import type { Ticket, Milestone, TicketStatus, MoSCoW } from '@/types/analysis';

interface Props {
  tickets: Ticket[];
  milestones: Milestone[];
  timelineWeeks: number;
}

const STATUS_CFG: Record<TicketStatus, { label: string; dot: string; badge: string; ring: string }> = {
  backlog:     { label: 'Backlog',     dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600',   ring: 'ring-gray-300' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700',   ring: 'ring-blue-300' },
  done:        { label: 'Done',        dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-300' },
};

const MOSCOW_CFG: Partial<Record<MoSCoW, { badge: string; dot: string }>> = {
  Must:   { badge: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  Should: { badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400' },
  Could:  { badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  Wont:   { badge: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-300' },
};

const TYPE_CFG: Record<string, { label: string; badge: string; dot: string }> = {
  Frontend: { label: 'FE', badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  Backend:  { label: 'BE', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  QA:       { label: 'QA', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  DevOps:   { label: 'DO', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
};

const PHASE_CFG = [
  { border: 'border-blue-300',    header: 'from-blue-600 to-blue-700',      light: 'bg-blue-50/60',    accent: 'blue' },
  { border: 'border-violet-300',  header: 'from-violet-600 to-violet-700',  light: 'bg-violet-50/60',  accent: 'violet' },
  { border: 'border-emerald-300', header: 'from-emerald-600 to-emerald-700',light: 'bg-emerald-50/60', accent: 'emerald' },
];

const STATUS_ORDER: TicketStatus[] = ['backlog', 'in_progress', 'done'];

function autoMilestones(tickets: Ticket[]): Milestone[] {
  const be   = tickets.filter((t) => t.type === 'Backend' || t.type === 'DevOps');
  const fe   = tickets.filter((t) => t.type === 'Frontend');
  const qa   = tickets.filter((t) => t.type === 'QA');
  const rest = tickets.filter((t) => !be.includes(t) && !fe.includes(t) && !qa.includes(t));
  const half = Math.ceil(be.length / 2);
  return [
    { id: 'M-1', name: 'Foundation',   phase: 1, description: 'Core infrastructure, auth & API setup',      ticketIds: be.slice(0, half).map((t) => t.id) },
    { id: 'M-2', name: 'Core Features',phase: 2, description: 'Primary user-facing functionality',          ticketIds: [...fe, ...be.slice(half), ...rest].map((t) => t.id) },
    { id: 'M-3', name: 'Launch Ready', phase: 3, description: 'QA hardening, DevOps & production readiness',ticketIds: qa.map((t) => t.id) },
  ];
}

export default function SprintTab({ tickets, milestones, timelineWeeks }: Props) {
  const activeMilestones = useMemo(
    () => ((milestones ?? []).length > 0 ? milestones : autoMilestones(tickets)),
    [milestones, tickets],
  );

  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const m of activeMilestones) for (const tid of m.ticketIds) map[tid] = m.id;
    for (const t of tickets) if (!map[t.id]) map[t.id] = activeMilestones[0]?.id ?? 'M-1';
    return map;
  });

  const [statuses, setStatuses] = useState<Record<string, TicketStatus>>(() => {
    const map: Record<string, TicketStatus> = {};
    for (const t of tickets) map[t.id] = t.status ?? 'backlog';
    return map;
  });

  const [dragId, setDragId]         = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    () => new Set(activeMilestones.map((m) => m.id)),
  );

  function toggleExpand(mid: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.has(mid) ? next.delete(mid) : next.add(mid);
      return next;
    });
  }

  function moveTicket(ticketId: string, milestoneId: string) {
    setAssignments((prev) => ({ ...prev, [ticketId]: milestoneId }));
  }

  function cycleStatus(ticketId: string) {
    setStatuses((prev) => {
      const cur = prev[ticketId] ?? 'backlog';
      return { ...prev, [ticketId]: STATUS_ORDER[(STATUS_ORDER.indexOf(cur) + 1) % STATUS_ORDER.length] };
    });
  }

  const weeksPerPhase = Math.max(1, Math.ceil(timelineWeeks / activeMilestones.length));

  const milestoneTickets = useMemo(() => {
    const map: Record<string, Ticket[]> = {};
    for (const m of activeMilestones) map[m.id] = [];
    for (const t of tickets) {
      const mid = assignments[t.id] ?? activeMilestones[0]?.id;
      if (mid && map[mid]) map[mid].push(t);
    }
    return map;
  }, [tickets, assignments, activeMilestones]);

  /* Overall progress */
  const overallDone    = tickets.filter((t) => statuses[t.id] === 'done').length;
  const overallInProg  = tickets.filter((t) => statuses[t.id] === 'in_progress').length;
  const overallPct     = tickets.length > 0 ? Math.round((overallDone / tickets.length) * 100) : 0;
  const mustCount      = tickets.filter((t) => t.moscow === 'Must').length;
  const mustDone       = tickets.filter((t) => t.moscow === 'Must' && statuses[t.id] === 'done').length;
  const totalPoints    = tickets.reduce((s, t) => s + t.effortPoints, 0);
  const donePoints     = tickets.filter((t) => statuses[t.id] === 'done').reduce((s, t) => s + t.effortPoints, 0);

  return (
    <div className="space-y-5">

      {/* ── Overall dashboard ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ProgressCard
          label="Completion"
          value={`${overallPct}%`}
          sub={`${overallDone} of ${tickets.length} tickets`}
          pct={overallPct}
          color="bg-brand-500"
        />
        <ProgressCard
          label="Points Burned"
          value={`${donePoints}/${totalPoints}`}
          sub="story points complete"
          pct={totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0}
          color="bg-violet-500"
        />
        <ProgressCard
          label="Must-Haves Done"
          value={`${mustDone}/${mustCount}`}
          sub="critical tickets"
          pct={mustCount > 0 ? Math.round((mustDone / mustCount) * 100) : 100}
          color="bg-red-500"
        />
        <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-4 flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Breakdown</p>
          <div className="mt-2 space-y-1.5">
            {STATUS_ORDER.map((s) => {
              const count = tickets.filter((t) => statuses[t.id] === s).length;
              const pct   = tickets.length > 0 ? (count / tickets.length) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${STATUS_CFG[s].dot}`} />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${STATUS_CFG[s].dot} opacity-80`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Filters & legend ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Show:</span>
          {(['all', ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CFG[s].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>Drag cards between phases</span>
          <span>·</span>
          <span>Click status to cycle</span>
        </div>
      </div>

      {/* ── Phase lanes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {activeMilestones.map((m, idx) => {
          const cfg = PHASE_CFG[idx] ?? PHASE_CFG[2];
          const allMTickets = milestoneTickets[m.id] ?? [];
          const mTickets = statusFilter === 'all'
            ? allMTickets
            : allMTickets.filter((t) => statuses[t.id] === statusFilter);

          const totalHours  = allMTickets.reduce((s, t) => s + t.hours, 0);
          const totalPts    = allMTickets.reduce((s, t) => s + t.effortPoints, 0);
          const donePts     = allMTickets.filter((t) => statuses[t.id] === 'done').reduce((s, t) => s + t.effortPoints, 0);
          const inProgCount = allMTickets.filter((t) => statuses[t.id] === 'in_progress').length;
          const doneCount   = allMTickets.filter((t) => statuses[t.id] === 'done').length;
          const mustLocal   = allMTickets.filter((t) => t.moscow === 'Must').length;
          const capacity    = weeksPerPhase * 40;
          const overCap     = totalHours > capacity;
          const loadPct     = Math.min(100, Math.round((totalHours / Math.max(capacity, 1)) * 100));
          const ptsPct      = totalPts > 0 ? Math.round((donePts / totalPts) * 100) : 0;
          const isExpanded  = expandedPhases.has(m.id);
          const isDragOver  = dragTarget === m.id;

          const startWeek = idx * weeksPerPhase + 1;
          const endWeek   = Math.min(timelineWeeks, (idx + 1) * weeksPerPhase);

          return (
            <div
              key={m.id}
              className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${cfg.border} ${isDragOver ? 'ring-2 ring-offset-1 ring-brand-400 scale-[1.01]' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragTarget(m.id); }}
              onDragLeave={() => setDragTarget(null)}
              onDrop={() => { if (dragId) moveTicket(dragId, m.id); setDragId(null); setDragTarget(null); }}
            >
              {/* Phase header */}
              <div className={`bg-gradient-to-br ${cfg.header} text-white px-4 pt-4 pb-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold opacity-70 uppercase tracking-widest">Phase {m.phase}</span>
                      <span className="text-xs opacity-60">Wk {startWeek}–{endWeek}</span>
                    </div>
                    <h3 className="font-bold text-base leading-tight">{m.name}</h3>
                    <p className="text-xs opacity-70 mt-0.5 leading-snug">{m.description}</p>
                  </div>
                  <button
                    onClick={() => toggleExpand(m.id)}
                    className="shrink-0 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                    </svg>
                  </button>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <span className="flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5">
                    <span className="opacity-80">📦</span> {allMTickets.length} tickets
                  </span>
                  <span className="flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5">
                    <span className="opacity-80">⚡</span> {totalPts} pts
                  </span>
                  {mustLocal > 0 && (
                    <span className="flex items-center gap-1 bg-red-400/40 rounded-full px-2 py-0.5">
                      🔴 {mustLocal} Must
                    </span>
                  )}
                </div>

                {/* Capacity bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs opacity-80 mb-1">
                    <span>Load: {totalHours}h / {capacity}h cap</span>
                    <span className={overCap ? 'text-red-200 font-bold' : ''}>{overCap ? '⚠ Over capacity' : `${loadPct}%`}</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${overCap ? 'bg-red-300' : 'bg-white'}`}
                      style={{ width: `${loadPct}%` }}
                    />
                  </div>
                </div>

                {/* Points progress */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs opacity-70 mb-1">
                    <span>Points burned: {donePts}/{totalPts}</span>
                    <span>{ptsPct}%</span>
                  </div>
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-300 rounded-full transition-all" style={{ width: `${ptsPct}%` }} />
                  </div>
                </div>

                {/* Done / In-Progress pills */}
                <div className="flex gap-2 mt-3">
                  <span className="text-xs bg-white/10 rounded px-2 py-0.5">✅ {doneCount} done</span>
                  {inProgCount > 0 && <span className="text-xs bg-white/10 rounded px-2 py-0.5">🔄 {inProgCount} active</span>}
                  <span className="text-xs bg-white/10 rounded px-2 py-0.5">⏸ {allMTickets.length - doneCount - inProgCount} backlog</span>
                </div>
              </div>

              {/* Ticket list */}
              {isExpanded && (
                <div className={`${cfg.light} p-3 space-y-2 min-h-[140px]`}>
                  {isDragOver && (
                    <div className="border-2 border-dashed border-brand-400 rounded-xl p-3 text-center text-xs text-brand-500 font-medium bg-brand-50/80 animate-pulse">
                      Drop here
                    </div>
                  )}

                  {mTickets.length === 0 && !isDragOver && (
                    <div className="text-center text-xs text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-xl">
                      {statusFilter === 'all' ? 'No tickets — drag one here' : `No ${STATUS_CFG[statusFilter as TicketStatus].label} tickets`}
                    </div>
                  )}

                  {mTickets.map((t) => {
                    const status = statuses[t.id] ?? 'backlog';
                    const sc     = STATUS_CFG[status];
                    const tc     = TYPE_CFG[t.type] ?? { label: t.type, badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
                    const mc     = t.moscow ? MOSCOW_CFG[t.moscow] : undefined;

                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); setDragId(t.id); }}
                        onDragEnd={() => { setDragId(null); setDragTarget(null); }}
                        className={`bg-white rounded-xl border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${dragId === t.id ? 'opacity-40 scale-95' : ''}`}
                      >
                        {/* Top: id + type + moscow */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="font-mono text-xs text-gray-400">{t.id}</span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${tc.badge}`}>{tc.label}</span>
                          {mc && (
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${mc.badge}`}>{t.moscow}</span>
                          )}
                          <span className="ml-auto text-xs text-gray-400 font-medium">{t.effortPoints}pt · {t.hours}h</span>
                        </div>

                        {/* Title */}
                        <p className="text-sm font-medium text-gray-800 leading-snug mb-3">{t.title}</p>

                        {/* Bottom: status + move buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => cycleStatus(t.id)}
                            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${sc.badge} ${sc.ring} transition-colors hover:opacity-80`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </button>

                          <div className="ml-auto flex gap-1">
                            {activeMilestones
                              .filter((mm) => mm.id !== m.id)
                              .map((mm, mmIdx) => (
                                <button
                                  key={mm.id}
                                  onClick={() => moveTicket(t.id, mm.id)}
                                  title={`Move to ${mm.name}`}
                                  className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors font-medium"
                                >
                                  → P{mmIdx < idx ? mmIdx + 1 : mmIdx + 1}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Collapsed footer */}
              {!isExpanded && (
                <div className="bg-white/80 px-4 py-2.5 text-xs text-gray-500 flex items-center justify-between">
                  <span>{allMTickets.length} tickets hidden</span>
                  <button onClick={() => toggleExpand(m.id)} className="text-brand-600 font-medium hover:underline">Expand</button>
                </div>
              )}

              {/* Phase footer */}
              {isExpanded && (
                <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Wk {startWeek}–{endWeek} · {weeksPerPhase} weeks</span>
                  <span className={overCap ? 'text-red-500 font-semibold' : ''}>
                    {overCap ? `${totalHours - capacity}h over cap` : `${capacity - totalHours}h slack`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Type + MoSCoW legend ── */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ticket Type</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(TYPE_CFG).map(([type, c]) => (
                <span key={type} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  {type}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">MoSCoW Priority</p>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(MOSCOW_CFG) as [MoSCoW, { badge: string; dot: string }][]).map(([m, c]) => (
                <span key={m} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</p>
            <div className="flex flex-wrap gap-3">
              {STATUS_ORDER.map((s) => (
                <span key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-2 h-2 rounded-full ${STATUS_CFG[s].dot}`} />
                  {STATUS_CFG[s].label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressCard({ label, value, sub, pct, color }: { label: string; value: string; sub: string; pct: number; color: string }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5 mb-3">{sub}</p>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

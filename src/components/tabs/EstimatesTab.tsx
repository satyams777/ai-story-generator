'use client';

import type { Ticket, Estimate } from '@/types/analysis';

interface Props {
  estimate: Estimate;
  initialEstimate: Estimate;
  tickets: Ticket[];
  hoursPerPoint: number;
  onTicketsChange: (tickets: Ticket[]) => void;
  onHoursPerPointChange: (hpp: number) => void;
  onReset: () => void;
}

const isEdited = (tickets: Ticket[], hpp: number, initialEstimate: Estimate) =>
  hpp !== 4 || tickets.some((t) => {
    const origPts = Math.round(t.hours / hpp) !== t.effortPoints;
    return origPts;
  }) || tickets.reduce((s, t) => s + t.effortPoints, 0) !== initialEstimate.totalPoints;

export default function EstimatesTab({
  estimate, initialEstimate, tickets, hoursPerPoint,
  onTicketsChange, onHoursPerPointChange, onReset,
}: Props) {

  function updatePoints(id: string, raw: string) {
    const pts = Math.max(1, Math.min(99, parseInt(raw) || 1));
    onTicketsChange(tickets.map((t) => t.id === id ? { ...t, effortPoints: pts } : t));
  }

  function setHpp(val: number) {
    onHoursPerPointChange(Math.max(1, Math.min(24, val)));
  }

  const edited = hoursPerPoint !== 4 || estimate.totalPoints !== initialEstimate.totalPoints;

  const maxHours = Math.max(
    estimate.breakdown.frontend,
    estimate.breakdown.backend,
    estimate.breakdown.qa,
    estimate.breakdown.devops,
    1
  );

  const lanes = [
    { label: 'Frontend', hours: estimate.breakdown.frontend, color: 'bg-blue-500' },
    { label: 'Backend',  hours: estimate.breakdown.backend,  color: 'bg-green-500' },
    { label: 'QA',       hours: estimate.breakdown.qa,       color: 'bg-purple-500' },
    { label: 'DevOps',   hours: estimate.breakdown.devops,   color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">

      {/* Explainer + Hours/Point control */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-brand-700 mb-1">What are story points?</p>
          <p className="text-sm text-brand-600">
            Points measure <span className="font-medium">relative effort</span>, not time.
            Set <span className="font-medium">Hours / Point</span> to your team's velocity — all hours and totals across <span className="font-medium">Tasks</span> and <span className="font-medium">Estimates</span> update instantly.
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-1 bg-white border border-brand-200 rounded-xl px-5 py-3">
          <p className="text-xs text-gray-500 font-medium">Hours / Point</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setHpp(hoursPerPoint - 1)} className="w-7 h-7 rounded border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold transition-colors">−</button>
            <input
              type="number" min={1} max={24} value={hoursPerPoint}
              onChange={(e) => setHpp(parseInt(e.target.value) || 1)}
              className="w-12 text-center text-lg font-bold border border-gray-200 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button onClick={() => setHpp(hoursPerPoint + 1)} className="w-7 h-7 rounded border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold transition-colors">+</button>
          </div>
          <p className="text-xs text-gray-400">1 pt = {hoursPerPoint}h</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Hours"  value={`${estimate.totalHours}h`}     sub="development effort"   changed={estimate.totalHours !== initialEstimate.totalHours} />
        <StatCard label="Story Points" value={String(estimate.totalPoints)}   sub="across all tickets"   changed={estimate.totalPoints !== initialEstimate.totalPoints} />
        <StatCard label="Timeline"     value={`${estimate.timelineWeeks}w`}   sub="at 40h/week capacity" changed={estimate.timelineWeeks !== initialEstimate.timelineWeeks} />
      </div>

      {/* Breakdown bars */}
      <div className="rounded-xl bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Effort Breakdown</h2>
        <div className="space-y-4">
          {lanes.map((lane) => (
            <div key={lane.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-gray-700">{lane.label}</span>
                <span className="text-gray-500">{lane.hours}h</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${lane.color} transition-all duration-300`} style={{ width: `${(lane.hours / maxHours) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable ticket table */}
      <div className="rounded-xl bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Ticket Estimates</h2>
            {edited && <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Modified</span>}
          </div>
          {edited && (
            <button onClick={onReset} className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors">
              Reset to AI defaults
            </button>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 font-medium text-gray-500 w-20">ID</th>
              <th className="text-left py-2 font-medium text-gray-500">Title</th>
              <th className="text-left py-2 font-medium text-gray-500 w-24">Type</th>
              <th className="text-center py-2 font-medium text-gray-500 w-36">
                Points <span className="text-gray-400 font-normal">(× {hoursPerPoint}h)</span>
              </th>
              <th className="text-right py-2 font-medium text-gray-500 w-20">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tickets.map((t) => {
              const origPts = initialEstimate.totalPoints > 0
                ? Math.round((t.hours / hoursPerPoint))
                : t.effortPoints;
              const changed = t.effortPoints !== origPts;
              return (
                <tr key={t.id} className={changed ? 'bg-amber-50' : ''}>
                  <td className="py-2.5 font-mono text-xs text-gray-400">{t.id}</td>
                  <td className="py-2.5 text-gray-800">{t.title}</td>
                  <td className="py-2.5"><TypeBadge type={t.type} /></td>
                  <td className="py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => updatePoints(t.id, String(t.effortPoints - 1))} className="w-6 h-6 rounded border border-gray-200 hover:bg-gray-100 text-gray-500 font-bold leading-none transition-colors">−</button>
                      <input
                        type="number" min={1} max={99} value={t.effortPoints}
                        onChange={(e) => updatePoints(t.id, e.target.value)}
                        className={`w-12 text-center text-sm font-semibold border rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                          changed ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-800'
                        }`}
                      />
                      <button onClick={() => updatePoints(t.id, String(t.effortPoints + 1))} className="w-6 h-6 rounded border border-gray-200 hover:bg-gray-100 text-gray-500 font-bold leading-none transition-colors">+</button>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-gray-700 font-medium">{t.hours}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Hours = Points × {hoursPerPoint} · Changes reflect in the <strong>Tasks</strong> tab immediately
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, changed }: { label: string; value: string; sub: string; changed: boolean }) {
  return (
    <div className={`rounded-xl border p-6 transition-colors ${changed ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${changed ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

const TYPE_BADGE: Record<string, string> = {
  Frontend: 'bg-blue-100 text-blue-700',
  Backend:  'bg-green-100 text-green-700',
  QA:       'bg-purple-100 text-purple-700',
  DevOps:   'bg-orange-100 text-orange-700',
};

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  );
}

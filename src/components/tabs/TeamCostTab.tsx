'use client';

import { useState, useMemo } from 'react';
import type { Estimate } from '@/types/analysis';

interface Props {
  estimate: Estimate;
}

interface RoleConfig {
  key: keyof Estimate['breakdown'];
  label: string;
  color: string;
  bgColor: string;
  defaultRate: number;
  icon: string;
}

const ROLES: RoleConfig[] = [
  { key: 'frontend', label: 'Frontend Dev',   color: '#2563eb', bgColor: 'bg-blue-50   border-blue-200',  defaultRate: 75,  icon: '🖥️'  },
  { key: 'backend',  label: 'Backend Dev',    color: '#16a34a', bgColor: 'bg-green-50  border-green-200', defaultRate: 85,  icon: '⚙️'  },
  { key: 'qa',       label: 'QA Engineer',   color: '#7c3aed', bgColor: 'bg-purple-50 border-purple-200',defaultRate: 60,  icon: '🧪'  },
  { key: 'devops',   label: 'DevOps Eng.',   color: '#ea580c', bgColor: 'bg-orange-50 border-orange-200',defaultRate: 90,  icon: '🚀'  },
];

const PM_RATE_DEFAULT = 70;
const DESIGNER_RATE_DEFAULT = 65;

function recommendCount(hours: number, timelineWeeks: number) {
  if (hours === 0) return 0;
  return Math.max(1, Math.ceil(hours / (timelineWeeks * 40)));
}

export default function TeamCostTab({ estimate }: Props) {
  const recommended = ROLES.map((r) => recommendCount(estimate.breakdown[r.key], estimate.timelineWeeks));

  const [teamSizes, setTeamSizes] = useState<number[]>(recommended);
  const [rates, setRates] = useState<number[]>(ROLES.map((r) => r.defaultRate));
  const [pmCount, setPmCount] = useState(1);
  const [designerCount, setDesignerCount] = useState(1);
  const [pmRate, setPmRate] = useState(PM_RATE_DEFAULT);
  const [designerRate, setDesignerRate] = useState(DESIGNER_RATE_DEFAULT);

  function setSize(idx: number, val: number) {
    setTeamSizes((prev) => prev.map((v, i) => (i === idx ? Math.max(0, val) : v)));
  }
  function setRate(idx: number, val: number) {
    setRates((prev) => prev.map((v, i) => (i === idx ? Math.max(1, val) : v)));
  }

  const breakdown = useMemo(() => {
    return ROLES.map((r, i) => {
      const hours = estimate.breakdown[r.key];
      const adjustedTimeline = teamSizes[i] > 0
        ? Math.ceil(hours / (teamSizes[i] * 40))
        : estimate.timelineWeeks;
      const cost = hours * rates[i];
      return { ...r, hours, count: teamSizes[i], rate: rates[i], cost, adjustedTimeline };
    });
  }, [estimate, teamSizes, rates]);

  const pmCost = pmCount * pmRate * estimate.timelineWeeks * 40;
  const designerCost = designerCount * designerRate * estimate.timelineWeeks * 20; // part-time
  const totalCost = breakdown.reduce((s, b) => s + b.cost, 0) + pmCost + designerCost;
  const totalTeam = teamSizes.reduce((s, v) => s + v, 0) + pmCount + designerCount;
  const maxTimeline = Math.max(...breakdown.map((b) => b.adjustedTimeline), 1);

  const budgetTiers = [
    { label: 'Conservative', multiplier: 1.2, note: '+20% buffer' },
    { label: 'Standard', multiplier: 1.35, note: '+35% for scope creep' },
    { label: 'Safe', multiplier: 1.5, note: '+50% for risk' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="👤" label="Team Size" value={String(totalTeam)} sub="people" color="text-brand-600" />
        <StatCard icon="⏱️" label="Timeline" value={`${maxTimeline}w`} sub="with this team" color="text-purple-600" />
        <StatCard icon="💵" label="Total Cost" value={`$${Math.round(totalCost / 1000)}k`} sub="at set rates" color="text-emerald-600" />
        <StatCard icon="📈" label="Burn Rate" value={`$${Math.round(totalCost / Math.max(maxTimeline, 1) / 1000)}k`} sub="per week" color="text-orange-600" />
      </div>

      {/* Role config */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Team Composition</h2>
            <p className="text-sm text-gray-500 mt-0.5">AI-recommended counts are pre-filled. Adjust to match your team.</p>
          </div>
          <button
            onClick={() => { setTeamSizes(recommended); setRates(ROLES.map((r) => r.defaultRate)); }}
            className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
          >
            Reset to recommended
          </button>
        </div>

        <div className="space-y-4">
          {ROLES.map((role, idx) => {
            const b = breakdown[idx];
            const isRecommended = teamSizes[idx] === recommended[idx];
            return (
              <div key={role.key} className={`rounded-xl border p-4 ${role.bgColor}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{role.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{role.label}</p>
                      <p className="text-xs text-gray-500">{b.hours}h total work · rec. {recommended[idx]} dev{recommended[idx] !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Team size */}
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-xs text-gray-500 font-medium">Headcount</p>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSize(idx, teamSizes[idx] - 1)} className="w-7 h-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-bold">−</button>
                        <input
                          type="number" min={0} max={20} value={teamSizes[idx]}
                          onChange={(e) => setSize(idx, parseInt(e.target.value) || 0)}
                          className={`w-12 text-center font-bold border rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 ${isRecommended ? 'border-gray-200' : 'border-amber-300 bg-amber-50'}`}
                        />
                        <button onClick={() => setSize(idx, teamSizes[idx] + 1)} className="w-7 h-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-bold">+</button>
                      </div>
                      {!isRecommended && <span className="text-xs text-amber-600">rec: {recommended[idx]}</span>}
                    </div>

                    {/* Rate */}
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-xs text-gray-500 font-medium">$/hr</p>
                      <input
                        type="number" min={10} max={500} value={rates[idx]}
                        onChange={(e) => setRate(idx, parseInt(e.target.value) || 1)}
                        className="w-20 text-center border border-gray-200 rounded-md py-1 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    {/* Cost */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-xs text-gray-500">Cost</p>
                      <p className="font-bold text-gray-800">${b.cost.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{b.adjustedTimeline}w delivery</p>
                    </div>
                  </div>
                </div>

                {/* Timeline bar */}
                {b.hours > 0 && (
                  <div className="mt-3">
                    <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (b.adjustedTimeline / maxTimeline) * 100)}%`, background: role.color }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{b.adjustedTimeline} of {maxTimeline} weeks</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* PM + Designer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SupportRole icon="📋" label="Product Manager" count={pmCount} setCount={setPmCount} rate={pmRate} setRate={setPmRate} cost={pmCost} note="Full project duration" />
            <SupportRole icon="🎨" label="UI/UX Designer" count={designerCount} setCount={setDesignerCount} rate={designerRate} setRate={setDesignerRate} cost={designerCost} note="Part-time (20h/week)" />
          </div>
        </div>
      </div>

      {/* Budget tiers */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Scenarios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {budgetTiers.map((tier) => (
            <div key={tier.label} className="rounded-xl border border-gray-200 p-5 text-center bg-gray-50">
              <p className="text-sm font-semibold text-gray-500 mb-1">{tier.label}</p>
              <p className="text-3xl font-bold text-gray-900">${Math.round((totalCost * tier.multiplier) / 1000)}k</p>
              <p className="text-xs text-gray-400 mt-1">{tier.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Base estimate: ${Math.round(totalCost / 1000)}k · Scenarios add risk and scope-creep buffers
        </p>
      </div>

      {/* Effort breakdown visual */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h2>
        <div className="space-y-3">
          {[...breakdown, { label: 'Product Manager', icon: '📋', cost: pmCost, color: '#0d9488' }, { label: 'UI/UX Designer', icon: '🎨', cost: designerCost, color: '#db2777' }].map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 w-36">{b.label}</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (b.cost / Math.max(totalCost, 1)) * 100)}%`, background: b.color }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 w-20 text-right">${b.cost.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-800 w-36">Total</span>
            <div className="flex-1" />
            <span className="text-sm font-bold text-gray-900 w-20 text-right">${totalCost.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-5 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function SupportRole({ icon, label, count, setCount, rate, setRate, cost, note }: {
  icon: string; label: string; count: number; setCount: (n: number) => void;
  rate: number; setRate: (n: number) => void; cost: number; note: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{label}</p>
          <p className="text-xs text-gray-400">{note}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCount(Math.max(0, count - 1))} className="w-6 h-6 rounded border border-gray-200 bg-white text-gray-600 font-bold text-sm">−</button>
          <span className="w-8 text-center font-bold">{count}</span>
          <button onClick={() => setCount(count + 1)} className="w-6 h-6 rounded border border-gray-200 bg-white text-gray-600 font-bold text-sm">+</button>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <span>$</span>
          <input type="number" min={10} max={500} value={rate} onChange={(e) => setRate(parseInt(e.target.value) || 1)} className="w-16 border border-gray-200 rounded py-0.5 px-1 text-center focus:outline-none focus:ring-1 focus:ring-brand-500" />
          <span>/hr</span>
        </div>
        <span className="ml-auto font-bold text-gray-800">${cost.toLocaleString()}</span>
      </div>
    </div>
  );
}

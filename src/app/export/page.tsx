'use client';

import { useEffect, useState } from 'react';
import type { AnalysisResult, Priority, MoSCoW } from '@/types/analysis';

const PRIORITY_COLOR: Record<Priority, string> = {
  High: '#dc2626',
  Medium: '#d97706',
  Low: '#16a34a',
};

const MOSCOW_COLOR: Record<MoSCoW, string> = {
  Must: '#dc2626',
  Should: '#2563eb',
  Could: '#7c3aed',
  Wont: '#6b7280',
};

export default function ExportPage() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [generated, setGenerated] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ba_export_data');
      if (raw) setData(JSON.parse(raw) as AnalysisResult);
    } catch { /* ignore */ }
    setGenerated(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: '#6b7280' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>No export data found</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>Go back to the dashboard and click "Export Report"</p>
        </div>
      </div>
    );
  }

  const totalCost = data.estimate.totalHours * 75;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #f8fafc; color: #1e293b; }
        .print-btn { position: fixed; top: 20px; right: 20px; z-index: 999; background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.4); }
        .print-btn:hover { background: #1d4ed8; }
        .report { max-width: 900px; margin: 0 auto; padding: 40px 20px 80px; }
        .cover { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; border-radius: 16px; padding: 60px 48px; margin-bottom: 32px; }
        .cover-title { font-size: 36px; font-weight: 800; margin-bottom: 8px; }
        .cover-sub { font-size: 18px; opacity: 0.85; margin-bottom: 32px; }
        .cover-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .stat-box { background: rgba(255,255,255,0.15); border-radius: 10px; padding: 16px; text-align: center; }
        .stat-val { font-size: 28px; font-weight: 800; }
        .stat-label { font-size: 12px; opacity: 0.8; margin-top: 4px; }
        .section { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; margin-bottom: 24px; }
        .section-title { font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .section-icon { font-size: 18px; }
        p { line-height: 1.7; color: #334155; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .mini-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
        .mini-card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 8px; }
        .chip { display: inline-block; background: #e0e7ff; color: #4338ca; font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 6px; margin: 3px; }
        .story { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
        .story-header { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 6px; }
        .story-actor { color: #2563eb; }
        .story-benefit { font-size: 13px; color: #64748b; margin-bottom: 10px; }
        .ac-list { list-style: none; }
        .ac-list li { font-size: 12px; color: #475569; display: flex; gap: 6px; margin-bottom: 4px; }
        .ac-list li::before { content: "✓"; color: #16a34a; font-weight: 700; flex-shrink: 0; }
        .milestone { border-left: 4px solid #2563eb; padding: 12px 16px; margin-bottom: 12px; background: #f8fafc; border-radius: 0 8px 8px 0; }
        .milestone-phase { font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.06em; }
        .milestone-name { font-size: 16px; font-weight: 700; color: #0f172a; margin: 4px 0; }
        .milestone-desc { font-size: 13px; color: #64748b; }
        .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .bar-label { width: 80px; font-size: 13px; font-weight: 500; color: #334155; }
        .bar-track { flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 5px; }
        .bar-hours { width: 60px; text-align: right; font-size: 13px; color: #64748b; }
        .assumption { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .assumption:last-child { border-bottom: none; }
        .assumption-id { font-size: 11px; font-family: monospace; color: #94a3b8; width: 32px; flex-shrink: 0; margin-top: 2px; }
        .assumption-text { font-size: 13px; color: #334155; flex: 1; }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
        @media print {
          .print-btn { display: none; }
          body { background: white; }
          .report { padding: 0; max-width: 100%; }
          .section, .cover { box-shadow: none; }
          .section { page-break-inside: avoid; }
        }
        @page { size: A4; margin: 15mm; }
      `}</style>

      <button className="print-btn" onClick={() => window.print()}>
        Print / Save as PDF
      </button>

      <div className="report">
        {/* Cover */}
        <div className="cover">
          <div className="cover-title">Project Analysis Report</div>
          <div className="cover-sub">Generated on {generated} · AI Business Analyst</div>
          <div className="cover-stats">
            <div className="stat-box">
              <div className="stat-val">{data.userStories.length}</div>
              <div className="stat-label">User Stories</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">{data.tickets.length}</div>
              <div className="stat-label">Tickets</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">{data.estimate.timelineWeeks}w</div>
              <div className="stat-label">Timeline</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">${(totalCost / 1000).toFixed(0)}k</div>
              <div className="stat-label">Est. Budget</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="section">
          <div className="section-title"><span className="section-icon">📋</span> Executive Summary</div>
          <p style={{ whiteSpace: 'pre-line' }}>{data.summary}</p>
        </div>

        {/* Scope: Actors & Assumptions */}
        <div className="grid-2">
          <div className="section">
            <div className="section-title"><span className="section-icon">👥</span> Actors</div>
            {data.actors.map((a) => (
              <div className="mini-card" key={a.name} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{a.name}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{a.role}</div>
              </div>
            ))}
          </div>
          <div className="section">
            <div className="section-title"><span className="section-icon">💡</span> Assumptions</div>
            <div>
              {(data.assumptions ?? []).map((a) => (
                <div className="assumption" key={a.id}>
                  <div className="assumption-id">{a.id}</div>
                  <div className="assumption-text">
                    {a.description}
                    <span className="badge" style={{ marginLeft: 8, background: '#f0f9ff', color: '#0369a1', fontSize: 10 }}>{a.category}</span>
                  </div>
                </div>
              ))}
              {(data.assumptions ?? []).length === 0 && <p style={{ color: '#94a3b8', fontSize: 13 }}>No assumptions recorded.</p>}
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="section">
          <div className="section-title"><span className="section-icon">✅</span> Functional Requirements</div>
          <table>
            <thead><tr><th style={{ width: 60 }}>ID</th><th>Description</th><th style={{ width: 80 }}>Priority</th></tr></thead>
            <tbody>
              {data.functionalRequirements.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{r.id}</td>
                  <td>{r.description}</td>
                  <td><span className="badge" style={{ background: PRIORITY_COLOR[r.priority] + '20', color: PRIORITY_COLOR[r.priority] }}>{r.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section">
          <div className="section-title"><span className="section-icon">⚙️</span> Non-Functional Requirements</div>
          <table>
            <thead><tr><th style={{ width: 60 }}>ID</th><th>Description</th><th style={{ width: 80 }}>Priority</th></tr></thead>
            <tbody>
              {data.nonFunctionalRequirements.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{r.id}</td>
                  <td>{r.description}</td>
                  <td><span className="badge" style={{ background: PRIORITY_COLOR[r.priority] + '20', color: PRIORITY_COLOR[r.priority] }}>{r.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Milestones */}
        {(data.milestones ?? []).length > 0 && (
          <div className="section">
            <div className="section-title"><span className="section-icon">🗺️</span> Project Milestones</div>
            {data.milestones.map((m) => (
              <div className="milestone" key={m.id} style={{ borderLeftColor: m.phase === 1 ? '#2563eb' : m.phase === 2 ? '#7c3aed' : '#16a34a' }}>
                <div className="milestone-phase">Phase {m.phase}</div>
                <div className="milestone-name">{m.name}</div>
                <div className="milestone-desc">{m.description}</div>
                <div style={{ marginTop: 8 }}>{m.ticketIds.map((tid) => <span className="chip" key={tid}>{tid}</span>)}</div>
              </div>
            ))}
          </div>
        )}

        {/* User Stories */}
        <div className="section">
          <div className="section-title"><span className="section-icon">📖</span> User Stories</div>
          {data.userStories.map((s) => (
            <div className="story" key={s.id}>
              <div className="story-header">
                <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>{s.id} · </span>
                As a <span className="story-actor">{s.actor}</span>, I want to <strong>{s.goal}</strong>
              </div>
              <div className="story-benefit">so that {s.benefit}</div>
              <ul className="ac-list">
                {s.acceptanceCriteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* Tickets */}
        <div className="section">
          <div className="section-title"><span className="section-icon">🎫</span> Work Breakdown — All Tickets</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Title</th>
                <th style={{ width: 80 }}>Type</th>
                <th style={{ width: 70 }}>MoSCoW</th>
                <th style={{ width: 50 }}>Pts</th>
                <th style={{ width: 60 }}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.tickets.map((t) => {
                const typeColors: Record<string, string> = { Frontend: '#2563eb', Backend: '#16a34a', QA: '#7c3aed', DevOps: '#ea580c' };
                return (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{t.id}</td>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td><span className="badge" style={{ background: (typeColors[t.type] ?? '#6b7280') + '20', color: typeColors[t.type] ?? '#6b7280' }}>{t.type}</span></td>
                    <td>{t.moscow && <span className="badge" style={{ background: MOSCOW_COLOR[t.moscow] + '20', color: MOSCOW_COLOR[t.moscow] }}>{t.moscow}</span>}</td>
                    <td style={{ textAlign: 'center' }}>{t.effortPoints}</td>
                    <td style={{ textAlign: 'right' }}>{t.hours}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Estimates */}
        <div className="section">
          <div className="section-title"><span className="section-icon">📊</span> Estimates & Cost</div>
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="mini-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>{data.estimate.totalHours}h</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Total Development Hours</div>
            </div>
            <div className="mini-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#7c3aed' }}>{data.estimate.timelineWeeks} weeks</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Estimated Timeline</div>
            </div>
            <div className="mini-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#16a34a' }}>{data.estimate.totalPoints}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Story Points</div>
            </div>
            <div className="mini-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#ea580c' }}>${totalCost.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Estimated Budget (@$75/hr)</div>
            </div>
          </div>

          <div className="mini-card-title" style={{ padding: '0 0 8px' }}>Effort by Discipline</div>
          {[
            { label: 'Frontend', hours: data.estimate.breakdown.frontend, color: '#2563eb' },
            { label: 'Backend', hours: data.estimate.breakdown.backend, color: '#16a34a' },
            { label: 'QA', hours: data.estimate.breakdown.qa, color: '#7c3aed' },
            { label: 'DevOps', hours: data.estimate.breakdown.devops, color: '#ea580c' },
          ].map(({ label, hours, color }) => {
            const max = Math.max(data.estimate.breakdown.frontend, data.estimate.breakdown.backend, data.estimate.breakdown.qa, data.estimate.breakdown.devops, 1);
            return (
              <div className="bar-row" key={label}>
                <div className="bar-label">{label}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(hours / max) * 100}%`, background: color }} /></div>
                <div className="bar-hours">{hours}h</div>
              </div>
            );
          })}
        </div>

        {/* Tech Stack */}
        <div className="section">
          <div className="section-title"><span className="section-icon">🛠️</span> Recommended Tech Stack</div>
          <div className="grid-2">
            {(Object.entries(data.techStack) as [string, { name: string; reason: string }[]][]).map(([category, items]) => (
              items.length > 0 && (
                <div className="mini-card" key={category}>
                  <div className="mini-card-title">{category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}</div>
                  {items.map((item) => (
                    <div key={item.name} style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>— {item.reason}</span>
                    </div>
                  ))}
                </div>
              )
            ))}
          </div>
        </div>

        {/* Risks */}
        <div className="section">
          <div className="section-title"><span className="section-icon">⚠️</span> Risk Assessment</div>
          <table>
            <thead>
              <tr>
                <th>Risk</th>
                <th style={{ width: 80 }}>Impact</th>
                <th style={{ width: 90 }}>Probability</th>
                <th>Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {data.risks.map((r, i) => (
                <tr key={i}>
                  <td>{r.description}</td>
                  <td><span className="badge" style={{ background: PRIORITY_COLOR[r.impact] + '20', color: PRIORITY_COLOR[r.impact] }}>{r.impact}</span></td>
                  <td><span className="badge" style={{ background: PRIORITY_COLOR[r.probability] + '20', color: PRIORITY_COLOR[r.probability] }}>{r.probability}</span></td>
                  <td style={{ fontSize: 12, color: '#475569' }}>{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="footer">
          Generated by AI Business Analyst · {generated} · All estimates are indicative
        </div>
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import type { Ticket, TicketType, UserStory, MoSCoW, Role } from '@/types/analysis';
import TicketModal from '@/components/TicketModal';

const TYPE_STYLES: Record<TicketType, string> = {
  Frontend: 'bg-blue-100 text-blue-700',
  Backend:  'bg-green-100 text-green-700',
  QA:       'bg-purple-100 text-purple-700',
  DevOps:   'bg-orange-100 text-orange-700',
};

const MOSCOW_STYLES: Record<MoSCoW, string> = {
  Must:   'bg-red-100 text-red-700',
  Should: 'bg-blue-100 text-blue-700',
  Could:  'bg-purple-100 text-purple-700',
  Wont:   'bg-gray-100 text-gray-500',
};

const TICKET_TYPES: TicketType[] = ['Frontend', 'Backend', 'QA', 'DevOps'];
const MOSCOW_OPTIONS: MoSCoW[]   = ['Must', 'Should', 'Could', 'Wont'];

interface Props {
  tickets: Ticket[];
  userStories: UserStory[];
  role?: Role;
  onTicketsChange?: (tickets: Ticket[]) => void;
}

type Filter = TicketType | 'All';

function nextId(tickets: Ticket[]): string {
  const nums = tickets.map((t) => parseInt(t.id.replace(/\D/g, ''), 10)).filter(Boolean);
  return `T-${Math.max(0, ...nums) + 1}`;
}

const EMPTY_FORM = { title: '', type: 'Frontend' as TicketType, storyId: '', moscow: 'Should' as MoSCoW, effortPoints: 3 };

export default function TasksTab({ tickets, userStories, role, onTicketsChange }: Props) {
  const canEdit = role === 'owner' && !!onTicketsChange;

  const [filter, setFilter]       = useState<Filter>('All');
  const [selected, setSelected]   = useState<Ticket | null>(null);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editForm, setEditForm]   = useState<Partial<Ticket>>({});
  const [showAdd, setShowAdd]     = useState(false);
  const [newForm, setNewForm]     = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  const types: Filter[] = ['All', 'Frontend', 'Backend', 'QA', 'DevOps'];
  const visible = filter === 'All' ? tickets : tickets.filter((t) => t.type === filter);

  const linkedStory = selected ? userStories.find((s) => s.id === selected.storyId) : undefined;

  /* ── edit helpers ── */
  function startEdit(t: Ticket) {
    setEditId(t.id);
    setEditForm({ ...t });
    setSelected(null);
  }

  function saveEdit() {
    if (!editId) return;
    const pts = Math.max(1, editForm.effortPoints ?? 1);
    onTicketsChange!(
      tickets.map((t) =>
        t.id === editId ? { ...t, ...editForm, effortPoints: pts, hours: pts * (t.hours / Math.max(t.effortPoints, 1)) } : t,
      ),
    );
    setEditId(null);
  }

  function cancelEdit() { setEditId(null); }

  /* ── add helpers ── */
  function addTicket() {
    if (!newForm.title.trim()) return;
    const pts = Math.max(1, newForm.effortPoints);
    const ticket: Ticket = {
      id: nextId(tickets),
      title: newForm.title.trim(),
      type: newForm.type,
      storyId: newForm.storyId || 'US-1',
      effortPoints: pts,
      hours: pts * 4,
      moscow: newForm.moscow,
    };
    onTicketsChange!([...tickets, ticket]);
    setNewForm({ ...EMPTY_FORM });
    setShowAdd(false);
  }

  /* ── delete ── */
  function confirmDelete() {
    if (!deleteId) return;
    onTicketsChange!(tickets.filter((t) => t.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <>
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {type}
                <span className="ml-1.5 text-xs opacity-70">
                  {type === 'All' ? tickets.length : tickets.filter((t) => t.type === type).length}
                </span>
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              onClick={() => { setShowAdd(true); setEditId(null); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
              Add Ticket
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-20">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-28">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-24">Story</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-24">MoSCoW</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">Pts</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">Hours</th>
                {canEdit && <th className="w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((ticket) =>
                editId === ticket.id ? (
                  /* ── Edit row ── */
                  <tr key={ticket.id} className="bg-brand-50 border-l-2 border-brand-500">
                    <td className="px-4 py-2 font-mono text-xs text-gray-400">{ticket.id}</td>
                    <td className="px-4 py-2">
                      <input
                        autoFocus
                        value={editForm.title ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        className="w-full border border-brand-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editForm.type ?? 'Frontend'}
                        onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as TicketType }))}
                        className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {TICKET_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editForm.storyId ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, storyId: e.target.value }))}
                        className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {userStories.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editForm.moscow ?? 'Should'}
                        onChange={(e) => setEditForm((f) => ({ ...f, moscow: e.target.value as MoSCoW }))}
                        className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {MOSCOW_OPTIONS.map((m) => <option key={m}>{m}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number" min={1} max={99}
                        value={editForm.effortPoints ?? 3}
                        onChange={(e) => setEditForm((f) => ({ ...f, effortPoints: parseInt(e.target.value) || 1 }))}
                        className="w-14 text-right border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400 text-xs">auto</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 justify-end">
                        <button onClick={saveEdit} className="px-2 py-1 rounded bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Save</button>
                        <button onClick={cancelEdit} className="px-2 py-1 rounded border border-gray-200 text-gray-500 text-xs hover:bg-gray-50">✕</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* ── View row ── */
                  <tr
                    key={ticket.id}
                    onClick={() => !canEdit && setSelected(ticket)}
                    className={`transition-colors group ${canEdit ? '' : 'cursor-pointer hover:bg-brand-50'}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{ticket.id}</td>
                    <td
                      className="px-4 py-3 text-gray-800 font-medium cursor-pointer hover:text-brand-700"
                      onClick={() => setSelected(ticket)}
                    >
                      {ticket.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_STYLES[ticket.type]}`}>{ticket.type}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{ticket.storyId}</td>
                    <td className="px-4 py-3">
                      {ticket.moscow && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MOSCOW_STYLES[ticket.moscow]}`}>{ticket.moscow}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{ticket.effortPoints}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{ticket.hours}h</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(ticket); }}
                            title="Edit ticket"
                            className="p-1.5 rounded-md hover:bg-brand-100 text-gray-400 hover:text-brand-600 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(ticket.id); }}
                            title="Delete ticket"
                            className="p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ),
              )}

              {/* ── Add new row ── */}
              {canEdit && showAdd && (
                <tr className="bg-emerald-50 border-l-2 border-emerald-500">
                  <td className="px-4 py-2 font-mono text-xs text-gray-400">{nextId(tickets)}</td>
                  <td className="px-4 py-2">
                    <input
                      autoFocus
                      placeholder="Ticket title…"
                      value={newForm.title}
                      onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') addTicket(); if (e.key === 'Escape') setShowAdd(false); }}
                      className="w-full border border-emerald-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select value={newForm.type} onChange={(e) => setNewForm((f) => ({ ...f, type: e.target.value as TicketType }))} className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none">
                      {TICKET_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select value={newForm.storyId} onChange={(e) => setNewForm((f) => ({ ...f, storyId: e.target.value }))} className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none">
                      <option value="">Story…</option>
                      {userStories.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select value={newForm.moscow} onChange={(e) => setNewForm((f) => ({ ...f, moscow: e.target.value as MoSCoW }))} className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none">
                      {MOSCOW_OPTIONS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number" min={1} max={99} value={newForm.effortPoints}
                      onChange={(e) => setNewForm((f) => ({ ...f, effortPoints: parseInt(e.target.value) || 1 }))}
                      className="w-14 text-right border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-gray-400">auto</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={addTicket} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700">Add</button>
                      <button onClick={() => setShowAdd(false)} className="px-2 py-1 rounded border border-gray-200 text-gray-500 text-xs hover:bg-gray-50">✕</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {visible.length === 0 && !showAdd && (
            <p className="text-center text-sm text-gray-400 py-8">No tickets match this filter.</p>
          )}
        </div>

        {canEdit ? (
          <p className="text-xs text-gray-400 text-center">Hover a row to edit or delete · Click the title to preview details</p>
        ) : (
          <p className="text-xs text-gray-400 text-center">Click any row to see ticket details</p>
        )}
      </div>

      {/* Ticket detail modal */}
      {selected && (
        <TicketModal ticket={selected} story={linkedStory} onClose={() => setSelected(null)} />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="text-2xl mb-2">🗑️</div>
            <h3 className="font-semibold text-gray-900 mb-1">Delete ticket {deleteId}?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

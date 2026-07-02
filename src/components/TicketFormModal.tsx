'use client';

import { useEffect, useState } from 'react';
import type { TicketType, MoSCoW, UserStory } from '@/types/analysis';

const TICKET_TYPES: TicketType[] = ['Frontend', 'Backend', 'QA', 'DevOps'];
const MOSCOW_OPTIONS: MoSCoW[] = ['Must', 'Should', 'Could', 'Wont'];

const TYPE_BAR: Record<TicketType, string> = {
  Frontend: 'bg-blue-500',
  Backend: 'bg-green-500',
  QA: 'bg-purple-500',
  DevOps: 'bg-orange-500',
};

export interface TicketFormValues {
  title: string;
  description: string;
  checklist: string[];
  type: TicketType;
  storyId: string;
  moscow: MoSCoW;
  effortPoints: number;
}

interface Props {
  mode: 'add' | 'edit';
  id: string;
  initial: TicketFormValues;
  userStories: UserStory[];
  onSave: (values: TicketFormValues) => void;
  onClose: () => void;
}

export default function TicketFormModal({ mode, id, initial, userStories, onSave, onClose }: Props) {
  const [form, setForm] = useState<TicketFormValues>(initial);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const canSave = form.title.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      checklist: form.checklist.map((c) => c.trim()).filter(Boolean),
      effortPoints: Math.max(1, form.effortPoints),
    });
  }

  function updateChecklistItem(i: number, value: string) {
    setForm((f) => ({ ...f, checklist: f.checklist.map((c, ci) => (ci === i ? value : c)) }));
  }

  function removeChecklistItem(i: number) {
    setForm((f) => ({ ...f, checklist: f.checklist.filter((_, ci) => ci !== i) }));
  }

  function addChecklistItem() {
    setForm((f) => ({ ...f, checklist: [...f.checklist, ''] }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className={`h-1.5 w-full ${TYPE_BAR[form.type]}`} />

        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{mode === 'add' ? 'New Ticket' : 'Edit Ticket'}</h2>
            <p className="font-mono text-xs text-gray-400 mt-0.5">{id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <Field label="Title">
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="Ticket title…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What needs to be done, context, edge cases…"
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </Field>

          <Field label="Implementation Checklist">
            <div className="space-y-2">
              {form.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="shrink-0 w-4 h-4 rounded border border-gray-300 flex items-center justify-center text-[10px] text-gray-400">
                    {i + 1}
                  </span>
                  <input
                    value={item}
                    onChange={(e) => updateChecklistItem(i, e.target.value)}
                    placeholder={`Step ${i + 1}…`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(i)}
                    aria-label="Remove item"
                    className="text-gray-400 hover:text-red-600 transition-colors text-sm px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addChecklistItem}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                + Add checklist item
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TicketType }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {TICKET_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="MoSCoW">
              <select
                value={form.moscow}
                onChange={(e) => setForm((f) => ({ ...f, moscow: e.target.value as MoSCoW }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {MOSCOW_OPTIONS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>

            <Field label="User Story">
              <select
                value={form.storyId}
                onChange={(e) => setForm((f) => ({ ...f, storyId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {userStories.length === 0 && <option value="">—</option>}
                {userStories.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
              </select>
            </Field>

            <Field label="Story Points">
              <input
                type="number"
                min={1}
                max={99}
                value={form.effortPoints}
                onChange={(e) => setForm((f) => ({ ...f, effortPoints: parseInt(e.target.value) || 1 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </Field>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {mode === 'add' ? 'Add Ticket' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</span>
      {children}
    </label>
  );
}

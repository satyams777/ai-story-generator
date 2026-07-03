'use client';

import { useEffect, useState } from 'react';
import type { Role } from '@/types/analysis';

interface Member {
  userId: string;
  role: Role;
  email: string;
  name: string | null;
}

interface Props {
  projectId: string;
  onClose: () => void;
}

const INVITABLE: { value: Role; label: string }[] = [
  { value: 'pm', label: 'Product Manager' },
  { value: 'developer', label: 'Developer' },
  { value: 'stakeholder', label: 'Stakeholder' },
];

export default function ShareProjectModal({ projectId, onClose }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('developer');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (res.ok) setMembers(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to invite');
      setEmail('');
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(userId: string, role: Role) {
    await fetch(`/api/projects/${projectId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    fetchMembers();
  }

  async function handleRemove(userId: string) {
    await fetch(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
    fetchMembers();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Share Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <form onSubmit={handleInvite} className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Invite by email</label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
              >
                {INVITABLE.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={inviting}
              className="w-full py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {inviting ? 'Inviting…' : 'Invite'}
            </button>
            <p className="text-xs text-gray-400">They need an existing account with this email.</p>
          </form>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">People with access</p>
            {loading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name || m.email}</p>
                      <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    </div>
                    {m.role === 'owner' ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-brand-100 text-brand-700 shrink-0">Owner</span>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value as Role)}
                          className="text-xs border border-gray-200 rounded-md px-1.5 py-1 focus:outline-none"
                        >
                          {INVITABLE.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <button
                          onClick={() => handleRemove(m.userId)}
                          title="Remove"
                          className="p-1 text-gray-300 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

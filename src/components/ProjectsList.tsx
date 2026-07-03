'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { Role } from '@/types/analysis';

interface ProjectSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  role: Role;
}

const ROLE_BADGE: Record<Role, { label: string; className: string }> = {
  owner:       { label: 'Owner',       className: 'bg-brand-100 text-brand-700' },
  pm:          { label: 'PM',          className: 'bg-purple-100 text-purple-700' },
  developer:   { label: 'Developer',   className: 'bg-green-100 text-green-700' },
  stakeholder: { label: 'Stakeholder', className: 'bg-amber-100 text-amber-700' },
};

interface Props {
  onNewAnalysis: () => void;
  onOpenProject: (id: string) => void;
  loadingProjectId: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProjectsList({ onNewAnalysis, onOpenProject, loadingProjectId }: Props) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Invited collaborators (pm/developer/stakeholder) only work within projects
  // an owner shared with them — they can't spin up new ones. A user with zero
  // projects is still allowed through once, so they can bootstrap their first
  // project and become its owner.
  const canCreateNew = !loading && (projects.length === 0 || projects.some((p) => p.role === 'owner'));

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) setProjects(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await fetch(`/api/projects/${deleteId}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <span className="text-sm font-semibold text-gray-900">AI Business Analyst</span>
          </div>
          <div className="flex items-center gap-4">
            {session?.user?.email && (
              <span className="text-sm text-gray-500 hidden sm:inline">{session.user.email}</span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">Saved analyses, ready to revisit or keep editing.</p>
          </div>
          {canCreateNew && (
            <button
              onClick={onNewAnalysis}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
              New Analysis
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading your projects…</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm font-medium text-gray-700">No projects yet</p>
            <p className="text-sm text-gray-400 mt-1">Run your first analysis to see it saved here.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-brand-300 transition-colors group"
              >
                <button
                  onClick={() => onOpenProject(p.id)}
                  disabled={loadingProjectId === p.id}
                  className="flex-1 min-w-0 text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {loadingProjectId === p.id ? 'Opening…' : p.name}
                    </p>
                    <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_BADGE[p.role].className}`}>
                      {ROLE_BADGE[p.role].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Updated {formatDate(p.updatedAt)} · Created {formatDate(p.createdAt)}
                  </p>
                </button>
                {p.role === 'owner' && (
                  <button
                    onClick={() => setDeleteId(p.id)}
                    title="Delete project"
                    className="p-2 rounded-md text-gray-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="text-2xl mb-2">🗑️</div>
            <h3 className="font-semibold text-gray-900 mb-1">Delete this project?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

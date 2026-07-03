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

const ROLE_BADGE: Record<Role, { label: string; icon: string; className: string; bar: string }> = {
  owner:       { label: 'Owner',       icon: '🧑‍💼', className: 'bg-brand-100 text-brand-700',   bar: 'from-brand-400 to-brand-600' },
  pm:          { label: 'PM',          icon: '📋',   className: 'bg-purple-100 text-purple-700', bar: 'from-purple-400 to-purple-600' },
  developer:   { label: 'Developer',   icon: '🧑‍💻', className: 'bg-green-100 text-green-700',   bar: 'from-green-400 to-green-600' },
  stakeholder: { label: 'Stakeholder', icon: '👀',   className: 'bg-amber-100 text-amber-700',   bar: 'from-amber-400 to-amber-600' },
};

interface Props {
  onNewAnalysis: () => void;
  onOpenProject: (id: string) => void;
  loadingProjectId: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(text: string): string {
  return text.trim().slice(0, 1).toUpperCase();
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
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-base shadow-soft">🧠</span>
            <span className="text-sm font-semibold text-gray-900">AI Business Analyst</span>
          </div>
          <div className="flex items-center gap-3">
            {session?.user?.email && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                  {initials(session.user.email)}
                </span>
                <span className="text-sm text-gray-500">{session.user.email}</span>
              </div>
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

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Projects</h1>
            <p className="text-sm text-gray-500 mt-1">Saved analyses, ready to revisit or keep editing.</p>
          </div>
          {canCreateNew && (
            <button
              onClick={onNewAnalysis}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-all shadow-glow hover:shadow-none"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
              New Analysis
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card animate-pulse">
                <div className="h-2 w-10 rounded-full bg-gray-100 mb-4" />
                <div className="h-4 w-3/4 rounded bg-gray-100 mb-2" />
                <div className="h-4 w-1/2 rounded bg-gray-100 mb-4" />
                <div className="h-3 w-2/3 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-2xl">📋</div>
            <p className="text-sm font-medium text-gray-700">No projects yet</p>
            <p className="text-sm text-gray-400 mt-1">Run your first analysis to see it saved here.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
              >
                <div className={`h-1 w-full bg-gradient-to-r ${ROLE_BADGE[p.role].bar}`} />
                <button
                  onClick={() => onOpenProject(p.id)}
                  disabled={loadingProjectId === p.id}
                  className="block w-full text-left p-5 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${ROLE_BADGE[p.role].className}`}>
                      <span>{ROLE_BADGE[p.role].icon}</span>{ROLE_BADGE[p.role].label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
                    {loadingProjectId === p.id ? 'Opening…' : p.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                    Updated {formatDate(p.updatedAt)} · Created {formatDate(p.createdAt)}
                  </p>
                </button>
                {p.role === 'owner' && (
                  <button
                    onClick={() => setDeleteId(p.id)}
                    title="Delete project"
                    className="absolute top-4 right-4 p-1.5 rounded-md bg-white/80 backdrop-blur text-gray-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-fade-up">
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

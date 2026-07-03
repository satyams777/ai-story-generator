'use client';

import { useEffect, useState } from 'react';

interface JiraProjectOpt { id: string; key: string; name: string; }
interface JiraIssueTypeOpt { id: string; name: string; }

export interface JiraTarget {
  jiraProjectKey: string;
  jiraIssueTypeId: string;
  jiraIssueTypeName: string;
}

interface Props {
  projectId: string;
  currentTarget: JiraTarget | null;
  onTargetChange: (target: JiraTarget | null) => void;
  onClose: () => void;
}

type ConnStatus = 'loading' | 'disconnected' | 'connected';

export default function JiraModal({ projectId, currentTarget, onTargetChange, onClose }: Props) {
  const [status, setStatus] = useState<ConnStatus>('loading');
  const [siteEmail, setSiteEmail] = useState<{ siteUrl: string; email: string } | null>(null);

  // connect form
  const [siteUrl, setSiteUrl] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // target selection
  const [pickingTarget, setPickingTarget] = useState(false);
  const [jiraProjects, setJiraProjects] = useState<JiraProjectOpt[]>([]);
  const [selectedProject, setSelectedProject] = useState<JiraProjectOpt | null>(null);
  const [issueTypes, setIssueTypes] = useState<JiraIssueTypeOpt[]>([]);
  const [selectedIssueTypeId, setSelectedIssueTypeId] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchConnection() {
    setStatus('loading');
    const res = await fetch('/api/jira/connection');
    const data = await res.json();
    if (data.connected) {
      setSiteEmail({ siteUrl: data.siteUrl, email: data.email });
      setStatus('connected');
    } else {
      setStatus('disconnected');
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await fetch('/api/jira/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, email, apiToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to connect');
      setSiteEmail({ siteUrl: data.siteUrl, email: data.email });
      setStatus('connected');
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    await fetch('/api/jira/connection', { method: 'DELETE' });
    setStatus('disconnected');
    setSiteEmail(null);
    onTargetChange(null);
  }

  async function startPickingTarget() {
    setPickingTarget(true);
    setTargetError(null);
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/jira/projects');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load Jira projects');
      setJiraProjects(data);
    } catch (err) {
      setTargetError(err instanceof Error ? err.message : 'Failed to load Jira projects');
    } finally {
      setLoadingProjects(false);
    }
  }

  async function selectProject(project: JiraProjectOpt) {
    setSelectedProject(project);
    setSelectedIssueTypeId('');
    setIssueTypes([]);
    setLoadingIssueTypes(true);
    setTargetError(null);
    try {
      const res = await fetch(`/api/jira/issue-types?projectId=${project.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load issue types');
      setIssueTypes(data);
      if (data[0]) setSelectedIssueTypeId(data[0].id);
    } catch (err) {
      setTargetError(err instanceof Error ? err.message : 'Failed to load issue types');
    } finally {
      setLoadingIssueTypes(false);
    }
  }

  async function saveTarget() {
    if (!selectedProject || !selectedIssueTypeId) return;
    setSavingTarget(true);
    setTargetError(null);
    const issueType = issueTypes.find((t) => t.id === selectedIssueTypeId);
    try {
      const res = await fetch('/api/jira/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appProjectId: projectId,
          jiraProjectKey: selectedProject.key,
          jiraIssueTypeId: selectedIssueTypeId,
          jiraIssueTypeName: issueType?.name ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save target');
      onTargetChange(data);
      setPickingTarget(false);
    } catch (err) {
      setTargetError(err instanceof Error ? err.message : 'Failed to save target');
    } finally {
      setSavingTarget(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Jira Integration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {status === 'loading' && <p className="text-sm text-gray-400">Loading…</p>}

          {status === 'disconnected' && (
            <form onSubmit={handleConnect} className="space-y-3">
              <p className="text-sm text-gray-500">Connect your Jira Cloud account to push tickets as real issues.</p>
              <Field label="Jira Site URL">
                <input
                  required value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="yourcompany.atlassian.net"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </Field>
              <Field label="API Token">
                <input
                  type="password" required value={apiToken} onChange={(e) => setApiToken(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Generate one at <span className="font-mono">id.atlassian.com/manage-profile/security/api-tokens</span>
                </p>
              </Field>
              {connectError && <p className="text-xs text-red-600">{connectError}</p>}
              <button
                type="submit" disabled={connecting}
                className="w-full py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {connecting ? 'Connecting…' : 'Connect Jira'}
              </button>
            </form>
          )}

          {status === 'connected' && !pickingTarget && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                <p className="text-sm text-green-800 font-medium">Connected as {siteEmail?.email}</p>
                <p className="text-xs text-green-600 truncate">{siteEmail?.siteUrl}</p>
              </div>

              {currentTarget ? (
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Pushing to</p>
                  <p className="text-sm text-gray-800">
                    <span className="font-mono font-semibold">{currentTarget.jiraProjectKey}</span> · {currentTarget.jiraIssueTypeName}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No target Jira project chosen yet for this project.</p>
              )}

              <button
                onClick={startPickingTarget}
                className="w-full py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {currentTarget ? 'Change target' : 'Choose target project'}
              </button>

              <button
                onClick={handleDisconnect}
                className="w-full py-2 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Disconnect Jira account
              </button>
            </div>
          )}

          {status === 'connected' && pickingTarget && (
            <div className="space-y-3">
              <Field label="Jira Project">
                {loadingProjects ? (
                  <p className="text-sm text-gray-400">Loading projects…</p>
                ) : (
                  <select
                    value={selectedProject?.id ?? ''}
                    onChange={(e) => {
                      const p = jiraProjects.find((jp) => jp.id === e.target.value);
                      if (p) selectProject(p);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select a project…</option>
                    {jiraProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.key} — {p.name}</option>
                    ))}
                  </select>
                )}
              </Field>

              {selectedProject && (
                <Field label="Issue Type">
                  {loadingIssueTypes ? (
                    <p className="text-sm text-gray-400">Loading issue types…</p>
                  ) : (
                    <select
                      value={selectedIssueTypeId}
                      onChange={(e) => setSelectedIssueTypeId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {issueTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                </Field>
              )}

              {targetError && <p className="text-xs text-red-600">{targetError}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setPickingTarget(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTarget}
                  disabled={!selectedProject || !selectedIssueTypeId || savingTarget}
                  className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {savingTarget ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors">
            Close
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

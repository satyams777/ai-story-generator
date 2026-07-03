export interface JiraCreds {
  siteUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
}

function normalizeSiteUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function authHeader(creds: JiraCreds): string {
  return 'Basic ' + Buffer.from(`${creds.email}:${creds.apiToken}`).toString('base64');
}

async function jiraFetch(creds: JiraCreds, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${normalizeSiteUrl(creds.siteUrl)}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(creds),
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export async function verifyJiraCredentials(creds: JiraCreds): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await jiraFetch(creds, '/rest/api/3/myself');
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: 'Invalid email or API token' };
    return { ok: false, error: `Jira returned ${res.status} — check the site URL` };
  } catch {
    return { ok: false, error: 'Could not reach that Jira site — check the URL' };
  }
}

export async function fetchJiraProjects(creds: JiraCreds): Promise<JiraProject[]> {
  const res = await jiraFetch(creds, '/rest/api/3/project/search?maxResults=100');
  if (!res.ok) throw new Error('Could not fetch Jira projects');
  const data = await res.json();
  return (data.values ?? []).map((p: { id: string; key: string; name: string }) => ({
    id: p.id,
    key: p.key,
    name: p.name,
  }));
}

export async function fetchJiraIssueTypes(creds: JiraCreds, projectId: string): Promise<JiraIssueType[]> {
  const res = await jiraFetch(creds, `/rest/api/3/issuetype/project?projectId=${projectId}`);
  if (!res.ok) throw new Error('Could not fetch issue types for that project');
  const data = await res.json();
  return (data ?? [])
    .filter((t: { subtask?: boolean }) => !t.subtask)
    .map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }));
}

interface AdfNode { type: string; version?: number; content?: unknown[]; text?: string }

function ticketToADF(description?: string, checklist?: string[]): AdfNode {
  const content: AdfNode[] = [];

  if (description?.trim()) {
    content.push({ type: 'paragraph', content: [{ type: 'text', text: description }] });
  }

  if (checklist && checklist.length > 0) {
    content.push({
      type: 'bulletList',
      content: checklist.map((item) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }],
      })),
    });
  }

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [{ type: 'text', text: 'No description provided.' }] });
  }

  return { type: 'doc', version: 1, content };
}

export async function createJiraIssue(
  creds: JiraCreds,
  params: { projectKey: string; issueTypeId: string; summary: string; description?: string; checklist?: string[] },
): Promise<{ key: string }> {
  const res = await jiraFetch(creds, '/rest/api/3/issue', {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        project: { key: params.projectKey },
        issuetype: { id: params.issueTypeId },
        summary: params.summary,
        description: ticketToADF(params.description, params.checklist),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err?.errorMessages?.[0]
      ?? (err?.errors ? Object.values(err.errors).join(', ') : `Jira returned ${res.status}`);
    throw new Error(message);
  }

  const data = await res.json();
  return { key: data.key };
}

export function jiraIssueUrl(siteUrl: string, key: string): string {
  return `${normalizeSiteUrl(siteUrl)}/browse/${key}`;
}

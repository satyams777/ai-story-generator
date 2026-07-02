'use client';

import type { UserStory, Ticket } from '@/types/analysis';
import MermaidDiagram from '@/components/MermaidDiagram';

const SPRINT_CAPACITY_PTS = 40;

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function sanitize(str: string): string {
  return str.replace(/[^a-zA-Z0-9 ()/-]/g, '').slice(0, 40);
}

interface StoryMeta {
  points: number;
  hours: number;
  critical: boolean;
}

function buildGantt(userStories: UserStory[], tickets: Ticket[], hoursPerPoint: number): string {
  const today = new Date();
  const storyMeta = new Map<string, StoryMeta>();

  for (const story of userStories) {
    const storyTickets = tickets.filter((t) => t.storyId === story.id);
    const points = storyTickets.reduce((sum, t) => sum + t.effortPoints, 0);
    storyMeta.set(story.id, {
      points,
      hours: points * hoursPerPoint,
      critical: storyTickets.some((t) => t.moscow === 'Must'),
    });
  }

  // Group stories into sprints by point capacity
  const sprints: UserStory[][] = [];
  let current: UserStory[] = [];
  let currentPts = 0;

  for (const story of userStories) {
    const pts = storyMeta.get(story.id)?.points ?? 0;
    if (currentPts + pts > SPRINT_CAPACITY_PTS && current.length > 0) {
      sprints.push(current);
      current = [];
      currentPts = 0;
    }
    current.push(story);
    currentPts += pts;
  }
  if (current.length > 0) sprints.push(current);

  let gantt = 'gantt\n  title Project Sprint Timeline\n  dateFormat YYYY-MM-DD\n  excludes weekends\n  todayMarker off\n';

  let sprintStart = new Date(today);

  sprints.forEach((stories, i) => {
    const sprintPts = stories.reduce((sum, story) => sum + (storyMeta.get(story.id)?.points ?? 0), 0);
    gantt += `  section Sprint ${i + 1} (${sprintPts} pts)\n`;

    // Stories in a sprint run as parallel workstreams within the same timebox,
    // not chained end-to-end — matches how a real sprint is actually delivered.
    let sprintDays = 1;
    stories.forEach((story, idx) => {
      const meta = storyMeta.get(story.id) ?? { points: 1, hours: hoursPerPoint, critical: false };
      const days = Math.max(1, Math.ceil(meta.hours / 8));
      const tag = meta.critical ? 'crit, ' : '';
      const label = `${story.id} - ${sanitize(story.goal)} (${meta.hours}h)`;
      gantt += `    ${label} :${tag}s${i}_${idx}, ${toDateStr(sprintStart)}, ${days}d\n`;
      sprintDays = Math.max(sprintDays, days);
    });

    const sprintEnd = new Date(sprintStart);
    sprintEnd.setDate(sprintEnd.getDate() + sprintDays);
    gantt += `    Sprint ${i + 1} Review :milestone, m${i}, ${toDateStr(sprintEnd)}, 0d\n`;

    // 2-day buffer for planning/retro before the next sprint starts
    sprintStart = new Date(sprintEnd);
    sprintStart.setDate(sprintStart.getDate() + 2);
  });

  return gantt;
}

interface Props {
  userStories: UserStory[];
  tickets: Ticket[];
  hoursPerPoint: number;
}

export default function GanttChart({ userStories, tickets, hoursPerPoint }: Props) {
  if (userStories.length === 0) return null;
  const chart = buildGantt(userStories, tickets, hoursPerPoint);
  return (
    <MermaidDiagram
      chart={chart}
      title="Sprint Timeline"
      caption="Auto-generated from live estimates"
      icon="📅"
      accent="blue"
    />
  );
}

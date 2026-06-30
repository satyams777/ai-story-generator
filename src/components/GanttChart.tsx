'use client';

import type { UserStory, Ticket } from '@/types/analysis';
import MermaidDiagram from '@/components/MermaidDiagram';

const SPRINT_CAPACITY_PTS = 40;

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function sanitize(str: string): string {
  return str.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 45);
}

function buildGantt(userStories: UserStory[], tickets: Ticket[], hoursPerPoint: number): string {
  const today = new Date();
  const storyPoints = new Map<string, number>();

  for (const story of userStories) {
    const pts = tickets
      .filter((t) => t.storyId === story.id)
      .reduce((sum, t) => sum + t.effortPoints, 0);
    storyPoints.set(story.id, pts);
  }

  // Group stories into sprints
  const sprints: UserStory[][] = [];
  let current: UserStory[] = [];
  let currentPts = 0;

  for (const story of userStories) {
    const pts = storyPoints.get(story.id) ?? 0;
    if (currentPts + pts > SPRINT_CAPACITY_PTS && current.length > 0) {
      sprints.push(current);
      current = [];
      currentPts = 0;
    }
    current.push(story);
    currentPts += pts;
  }
  if (current.length > 0) sprints.push(current);

  let gantt = 'gantt\n  title Project Sprint Timeline\n  dateFormat YYYY-MM-DD\n  excludes weekends\n';

  let cursor = new Date(today);

  sprints.forEach((stories, i) => {
    gantt += `  section Sprint ${i + 1}\n`;
    for (const story of stories) {
      const pts = storyPoints.get(story.id) ?? 1;
      const hours = pts * hoursPerPoint;
      const days = Math.max(1, Math.ceil(hours / 8));
      gantt += `    ${sanitize(story.goal)}  :${toDateStr(cursor)}, ${days}d\n`;
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + days);
    }
    // Sprint gap (2 days for planning)
    cursor.setDate(cursor.getDate() + 2);
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
  return <MermaidDiagram chart={chart} title="Sprint Timeline (auto-generated from estimates)" />;
}

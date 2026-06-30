import type { Ticket, Estimate } from '@/types/analysis';

const EFFORT_POINTS: Record<string, number> = {
  Frontend: 3,
  Backend: 5,
  QA: 2,
  DevOps: 8,
};

const HOURS_PER_POINT = 4;
const WEEKLY_CAPACITY = 40;

export function estimateTickets(rawTickets: Omit<Ticket, 'effortPoints' | 'hours'>[]): {
  tickets: Ticket[];
  estimate: Estimate;
} {
  const breakdown = { frontend: 0, backend: 0, qa: 0, devops: 0 };
  let totalPoints = 0;

  const tickets: Ticket[] = rawTickets.map((t) => {
    const effortPoints = EFFORT_POINTS[t.type] ?? 3;
    const hours = effortPoints * HOURS_PER_POINT;
    totalPoints += effortPoints;
    const key = t.type.toLowerCase() as keyof typeof breakdown;
    breakdown[key] += hours;
    return { ...t, effortPoints, hours };
  });

  const totalHours = totalPoints * HOURS_PER_POINT;
  const timelineWeeks = Math.ceil(totalHours / WEEKLY_CAPACITY);

  return {
    tickets,
    estimate: { totalHours, totalPoints, timelineWeeks, breakdown },
  };
}

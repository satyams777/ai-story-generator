import type { UserStory, Ticket } from '@/types/analysis';
import MermaidDiagram from '@/components/MermaidDiagram';
import GanttChart from '@/components/GanttChart';

interface Props {
  diagrams: {
    flowDiagram: string;
    architectureDiagram: string;
  };
  userStories: UserStory[];
  tickets: Ticket[];
  hoursPerPoint: number;
}

export default function DiagramsTab({ diagrams, userStories, tickets, hoursPerPoint }: Props) {
  return (
    <div className="space-y-6">
      <MermaidDiagram chart={diagrams.flowDiagram} title="Process Flow" />
      <MermaidDiagram chart={diagrams.architectureDiagram} title="Architecture" />
      <GanttChart userStories={userStories} tickets={tickets} hoursPerPoint={hoursPerPoint} />
    </div>
  );
}

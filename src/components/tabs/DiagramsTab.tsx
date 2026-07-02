import type { UserStory, Ticket } from '@/types/analysis';
import MermaidDiagram from '@/components/MermaidDiagram';
import GanttChart from '@/components/GanttChart';

interface Props {
  diagrams: {
    flowDiagram: string;
    architectureDiagram: string;
    sequenceDiagram?: string;
    erDiagram?: string;
    stateDiagram?: string;
  };
  userStories: UserStory[];
  tickets: Ticket[];
  hoursPerPoint: number;
}

const CATALOG = [
  { key: 'flowDiagram',         title: 'Process Flow',        caption: 'End-to-end user & business process',        icon: '🔀', accent: 'indigo'  },
  { key: 'architectureDiagram', title: 'System Architecture', caption: 'Components and how they connect',           icon: '🏗️', accent: 'blue'    },
  { key: 'sequenceDiagram',     title: 'Sequence',            caption: 'Runtime interaction between actors & services', icon: '🔁', accent: 'purple'  },
  { key: 'erDiagram',           title: 'Data Model',          caption: 'Core entities, keys and relationships',     icon: '🗄️', accent: 'emerald' },
  { key: 'stateDiagram',        title: 'State Lifecycle',     caption: 'Lifecycle of the central domain entity',    icon: '🔄', accent: 'amber'   },
] as const;

export default function DiagramsTab({ diagrams, userStories, tickets, hoursPerPoint }: Props) {
  const available = CATALOG.filter((d) => (diagrams[d.key] ?? '').trim().length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Diagrams</h2>
        <p className="text-sm text-gray-500">
          Scroll to zoom, drag to pan, and download any diagram as PNG or SVG. {available.length} generated views.
        </p>
      </div>

      {available.map((d) => (
        <MermaidDiagram
          key={d.key}
          chart={diagrams[d.key] as string}
          title={d.title}
          caption={d.caption}
          icon={d.icon}
          accent={d.accent}
        />
      ))}

      <GanttChart userStories={userStories} tickets={tickets} hoursPerPoint={hoursPerPoint} />
    </div>
  );
}

export type Priority = 'High' | 'Medium' | 'Low';
export type TicketType = 'Frontend' | 'Backend' | 'QA' | 'DevOps';
export type MoSCoW = 'Must' | 'Should' | 'Could' | 'Wont';
export type TicketStatus = 'backlog' | 'in_progress' | 'done';
export type Role = 'owner' | 'stakeholder' | 'developer' | 'pm';

export interface Actor {
  name: string;
  role: string;
}

export interface Requirement {
  id: string;
  description: string;
  priority: Priority;
}

export interface Risk {
  description: string;
  impact: Priority;
  probability: Priority;
  mitigation: string;
}

export interface TechItem {
  name: string;
  reason: string;
}

export interface TechStack {
  frontend: TechItem[];
  backend: TechItem[];
  database: TechItem[];
  devops: TechItem[];
  thirdParty: TechItem[];
}

export interface UserStory {
  id: string;
  actor: string;
  goal: string;
  benefit: string;
  acceptanceCriteria: string[];
}

export interface Ticket {
  id: string;
  title: string;
  type: TicketType;
  storyId: string;
  effortPoints: number;
  hours: number;
  moscow?: MoSCoW;
  status?: TicketStatus;
  sprint?: number;
  milestoneId?: string;
}

export interface Estimate {
  totalHours: number;
  totalPoints: number;
  timelineWeeks: number;
  breakdown: {
    frontend: number;
    backend: number;
    qa: number;
    devops: number;
  };
}

export interface Assumption {
  id: string;
  description: string;
  category: 'Technical' | 'Business' | 'Scope' | 'Timeline';
}

export interface Milestone {
  id: string;
  name: string;
  phase: number;
  description: string;
  ticketIds: string[];
}

export interface AnalysisResult {
  summary: string;
  actors: Actor[];
  functionalRequirements: Requirement[];
  nonFunctionalRequirements: Requirement[];
  risks: Risk[];
  techStack: TechStack;
  userStories: UserStory[];
  tickets: Ticket[];
  estimate: Estimate;
  assumptions: Assumption[];
  milestones: Milestone[];
  diagrams: {
    flowDiagram: string;
    architectureDiagram: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

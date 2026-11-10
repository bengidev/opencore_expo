import type { ReactNode } from 'react';

/** How a step's mark reads: waiting, in progress, or done. */
export type AgentActivityStepStatus = 'pending' | 'active' | 'complete';

export type AgentSearchResult = {
  id: string;
  title: string;
  domain?: string;
  url?: string;
  icon?: ReactNode;
};

export type AgentActivityStep = {
  id: string;
  type: 'step';
  label: ReactNode;
  status?: AgentActivityStepStatus;
  meta?: string;
};

export type AgentActivityText = {
  id: string;
  type: 'text';
  content: ReactNode;
};

export type AgentActivitySearch = {
  id: string;
  type: 'search';
  query: string;
  results?: AgentSearchResult[];
  moreCount?: number;
};

export type AgentActivityTool = {
  id: string;
  type: 'tool';
  action: 'read' | 'edit' | 'run' | (string & {});
  target: string;
  additions?: number;
  deletions?: number;
};

export type AgentActivityTrace = {
  id: string;
  type: 'trace';
  kind: 'thinking' | 'message' | 'write' | 'run' | 'read' | (string & {});
  label: ReactNode;
  detail?: string;
  icon?: ReactNode;
};

export type AgentActivityItem =
  | AgentActivityStep
  | AgentActivityText
  | AgentActivitySearch
  | AgentActivityTool
  | AgentActivityTrace;

export type AgentActivityItemType = AgentActivityItem['type'];

export type AgentActivityContentType = AgentActivityItemType | 'mixed';

export type AgentActivityStatus = 'working' | 'complete';

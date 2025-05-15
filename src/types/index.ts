export type AgentRole = 'coordinator' | 'researcher' | 'writer' | 'designer' | 'twitter-agent';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  avatar: string;
  color: string;
  description: string;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  parentTaskId: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  subTasks: SubTask[];
}

export interface Message {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'task-assignment' | 'task-completion' | 'user-message';
  taskId?: string;
}

export interface Campaign {
  id: string;
  request: string;
  tasks: Task[];
  messages: Message[];
  status: 'planning' | 'in-progress' | 'completed';
  createdAt: Date;
  metrics: CampaignMetrics;
  details: CampaignDetails;
}

export interface TwitterAccount {
  handle: string;
  postsCount: number;
  likesCount: number;
  repliesCount: number;
  retweetsCount: number;
}

export interface CampaignMetrics {
  totalPosts: number;
  totalLikes: number;
  totalReplies: number;
  totalRetweets: number;
  twitterAccounts: TwitterAccount[];
}

export interface CampaignDetails {
  slogan?: string;
  productDescription?: string;
  productImages?: string[];
  targetAudience?: string;
  expectedMetrics?: {
    posts?: number;
    likes?: number;
    replies?: number;
    retweets?: number;
  };
}
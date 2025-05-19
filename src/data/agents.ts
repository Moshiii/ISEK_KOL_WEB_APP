import { Agent } from '../types';
import { 
  CircleUserRound, 
  UserCog, 
  PenTool, 
  Sparkles, 
  User, 
  Palette, 
  Edit3, 
  Target, 
  Code, 
  ShieldCheck, 
  Megaphone, 
  BarChart2, 
  Headphones, 
  Camera, 
  Video, 
  Users 
} from 'lucide-react';

export const agents: Agent[] = [
  {
    id: 'user',
    name: 'User',
    role: 'user',
    avatar: 'user',
    color: '#F43F5E', // Rose
    description: 'User of the system'
  },
  {
    id: 'coordinator',
    name: 'Alex',
    role: 'coordinator',
    avatar: 'coordinator',
    color: '#4F46E5', // Indigo
    description: 'Campaign coordinator who manages task allocation and overall strategy'
  },
  {
    id: 'researcher',
    name: 'Riley',
    role: 'researcher',
    avatar: 'researcher',
    color: '#0EA5E9', // Sky blue
    description: 'Data analyst who gathers information and performs market research'
  },
  {
    id: 'writer',
    name: 'Jordan',
    role: 'writer',
    avatar: 'writer',
    color: '#10B981', // Emerald
    description: 'Content writer who creates compelling copy and messaging'
  },
  {
    id: 'designer',
    name: 'Taylor',
    role: 'designer', 
    avatar: 'designer',
    color: '#8B5CF6', // Violet
    description: 'Creative designer who handles visual elements and branding'
  },
  {
    id: 'editor',
    name: 'Morgan',
    role: 'editor',
    avatar: 'editor',
    color: '#F59E42', // Orange
    description: 'Editor who reviews and refines content for clarity and accuracy'
  },
  {
    id: 'strategist',
    name: 'Casey',
    role: 'strategist',
    avatar: 'strategist',
    color: '#6366F1', // Blue Violet
    description: 'Strategist who develops campaign plans and goals'
  },
  {
    id: 'developer',
    name: 'Jamie',
    role: 'developer',
    avatar: 'developer',
    color: '#22D3EE', // Cyan
    description: 'Developer who implements technical solutions'
  },
  {
    id: 'qa',
    name: 'Sam',
    role: 'qa',
    avatar: 'qa',
    color: '#FBBF24', // Amber
    description: 'Quality assurance specialist who tests and ensures product quality'
  },
  {
    id: 'marketer',
    name: 'Drew',
    role: 'marketer',
    avatar: 'marketer',
    color: '#F472B6', // Pink
    description: 'Marketer who promotes campaigns and manages outreach'
  },
  {
    id: 'analyst',
    name: 'Robin',
    role: 'analyst',
    avatar: 'analyst',
    color: '#34D399', // Green
    description: 'Analyst who interprets data and provides insights'
  },
  {
    id: 'support',
    name: 'Skyler',
    role: 'support',
    avatar: 'support',
    color: '#60A5FA', // Light Blue
    description: 'Support agent who assists users and resolves issues'
  },
  {
    id: 'photographer',
    name: 'Harper',
    role: 'photographer',
    avatar: 'photographer',
    color: '#F87171', // Red
    description: 'Photographer who captures and edits images'
  },
  {
    id: 'videographer',
    name: 'Quinn',
    role: 'videographer',
    avatar: 'videographer',
    color: '#A78BFA', // Purple
    description: 'Videographer who creates and edits video content'
  },
  {
    id: 'community',
    name: 'Peyton',
    role: 'community',
    avatar: 'community',
    color: '#FDE68A', // Yellow
    description: 'Community manager who engages with the audience and builds relationships'
  }
];

export const getAgentIcon = (role: Agent['role']) => {
  switch (role) {
    case 'user':
      return User;
    case 'coordinator':
      return CircleUserRound;
    case 'researcher':
      return BarChart2;
    case 'writer':
      return Edit3;
    case 'designer':
      return Palette;
    case 'editor':
      return PenTool;
    case 'strategist':
      return Target;
    case 'developer':
      return Code;
    case 'qa':
      return ShieldCheck;
    case 'marketer':
      return Megaphone;
    case 'analyst':
      return BarChart2;
    case 'support':
      return Headphones;
    case 'photographer':
      return Camera;
    case 'videographer':
      return Video;
    case 'community':
      return Users;
    default:
      return CircleUserRound;
  }
};

export const getAgentById = (id: string): Agent => {
  return agents.find(agent => agent.id === id) || agents[0];
};
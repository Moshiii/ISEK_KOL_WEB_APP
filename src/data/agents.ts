import { Agent } from '../types';
import { 
  CircleUserRound, 
  UserCog, 
  PenTool, 
  Sparkles, 
  User, 
  Briefcase, 
  Code, 
  BookOpen, 
  Mic, 
  Camera, 
  Globe, 
  Heart, 
  BarChart2, 
  Layers, 
  Shield, 
  Users 
} from 'lucide-react';

export const agents: Agent[] = [
  {
    id: 'user',
    name: '用户',
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
    id: 'developer',
    name: 'Morgan',
    role: 'developer',
    avatar: 'developer',
    color: '#F59E42', // Orange
    description: 'Software developer responsible for technical implementation'
  },
  {
    id: 'editor',
    name: 'Casey',
    role: 'editor',
    avatar: 'editor',
    color: '#6366F1', // Blue Violet
    description: 'Editor who reviews and polishes content before publishing'
  },
  {
    id: 'photographer',
    name: 'Jamie',
    role: 'photographer',
    avatar: 'photographer',
    color: '#FBBF24', // Amber
    description: 'Photographer capturing campaign visuals'
  },
  {
    id: 'videographer',
    name: 'Drew',
    role: 'videographer',
    avatar: 'videographer',
    color: '#06B6D4', // Cyan
    description: 'Videographer producing video content'
  },
  {
    id: 'strategist',
    name: 'Robin',
    role: 'strategist',
    avatar: 'strategist',
    color: '#A3E635', // Lime
    description: 'Strategist planning campaign direction and goals'
  },
  {
    id: 'analyst',
    name: 'Sam',
    role: 'analyst',
    avatar: 'analyst',
    color: '#F472B6', // Pink
    description: 'Analyst tracking performance and metrics'
  },
  {
    id: 'community_manager',
    name: 'Charlie',
    role: 'community_manager',
    avatar: 'community_manager',
    color: '#34D399', // Green
    description: 'Community manager engaging with the audience'
  },
  {
    id: 'influencer',
    name: 'Skyler',
    role: 'influencer',
    avatar: 'influencer',
    color: '#F87171', // Red
    description: 'Influencer promoting the campaign to followers'
  },
  {
    id: 'advisor',
    name: 'Quinn',
    role: 'advisor',
    avatar: 'advisor',
    color: '#60A5FA', // Blue
    description: 'Advisor providing expert guidance'
  },
  {
    id: 'security',
    name: 'Pat',
    role: 'security',
    avatar: 'security',
    color: '#64748B', // Slate
    description: 'Security specialist ensuring data and privacy protection'
  }
];

export const getAgentIcon = (role: Agent['role']) => {
  switch (role) {
    case 'user':
      return User;
    case 'coordinator':
      return CircleUserRound;
    case 'researcher':
      return UserCog;
    case 'writer':
      return PenTool;
    case 'designer':
      return Sparkles;
    case 'developer':
      return Code;
    case 'editor':
      return BookOpen;
    case 'photographer':
      return Camera;
    case 'videographer':
      return Mic;
    case 'strategist':
      return Briefcase;
    case 'analyst':
      return BarChart2;
    case 'community_manager':
      return Users;
    case 'influencer':
      return Globe;
    case 'advisor':
      return Heart;
    case 'security':
      return Shield;
    default:
      return CircleUserRound;
  }
};

export const getAgentById = (id: string): Agent => {
  return agents.find(agent => agent.id === id) || agents[0];
};
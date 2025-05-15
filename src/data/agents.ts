import { Agent } from '../types';
import { CircleUserRound, UserCog, PenTool, Sparkles, User } from 'lucide-react';

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
    default:
      return CircleUserRound;
  }
};

export const getAgentById = (id: string): Agent => {
  return agents.find(agent => agent.id === id) || agents[0];
};
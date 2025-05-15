import React from 'react';
import { Agent } from '../types';
import { getAgentIcon } from '../data/agents';

interface AgentAvatarProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ agent, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const IconComponent = getAgentIcon(agent.role);
  
  return (
    <div 
      className={`rounded-full flex items-center justify-center ${sizeClasses[size]}`}
      style={{ backgroundColor: agent.color }}
    >
      <IconComponent className="text-white" size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
    </div>
  );
};

export default AgentAvatar;
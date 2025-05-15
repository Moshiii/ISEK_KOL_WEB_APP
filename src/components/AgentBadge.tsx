import React from 'react';
import { Agent } from '../types';

interface AgentBadgeProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
}

const AgentBadge: React.FC<AgentBadgeProps> = ({ agent, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };
  
  return (
    <span 
      className={`rounded-full inline-block font-medium ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: `${agent.color}20`, // 20% opacity version of the agent color
        color: agent.color,
        border: `1px solid ${agent.color}40` // 40% opacity border
      }}
    >
      {agent.name} • {agent.role}
    </span>
  );
};

export default AgentBadge;
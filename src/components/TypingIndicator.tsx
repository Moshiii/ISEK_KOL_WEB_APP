import React from 'react';
import { Agent } from '../types';
import AgentAvatar from './AgentAvatar';

interface TypingIndicatorProps {
  agent: Agent;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ agent }) => {
  return (
    <div className="flex mb-4 animate-fadeIn">
      <div className="mr-3 flex-shrink-0">
        <AgentAvatar agent={agent} />
      </div>
      <div className="flex items-end">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${agent.color}10` }}
        >
          <div className="flex space-x-1">
            <div className="typing-dot" style={{ backgroundColor: agent.color }}></div>
            <div className="typing-dot animation-delay-200" style={{ backgroundColor: agent.color }}></div>
            <div className="typing-dot animation-delay-400" style={{ backgroundColor: agent.color }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
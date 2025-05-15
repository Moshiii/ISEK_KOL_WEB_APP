import React from 'react';
import { Message, Agent } from '../types';
import { getAgentById } from '../data/agents';
import AgentAvatar from './AgentAvatar';
import { ClipboardCheck } from 'lucide-react';

interface AgentMessageProps {
  message: Message;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ message }) => {
  const agent = getAgentById(message.agentId);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderMessageContent = () => {
    if (message.type === 'task-assignment') {
      return (
        <div className="flex items-center space-x-2 py-1 px-3 bg-gray-100 rounded-lg text-sm">
          <ClipboardCheck size={16} className="text-gray-500" />
          <span dangerouslySetInnerHTML={{ __html: message.content }}></span>
        </div>
      );
    }
    
    return <p className="whitespace-pre-wrap">{message.content}</p>;
  };

  const messageClasses = message.agentId === 'user' ? 'ml-auto' : '';
  const contentClasses = message.agentId === 'user' ? 'bg-gradient-to-r from-[#5370FF] to-[#FF66C5] text-white' : `bg-opacity-10 border-l-3`;
  
  return (
    <div className={`flex mb-4 animate-fadeIn ${messageClasses} ${message.agentId === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`${message.agentId === 'user' ? 'ml-3' : 'mr-3'} flex-shrink-0`}>
        <AgentAvatar agent={agent} />
      </div>
      <div className={`flex flex-col max-w-[80%] ${message.agentId === 'user' ? 'items-end' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${message.agentId === 'user' ? 'flex-row-reverse' : ''}`}>
          <span className="font-semibold" style={{ color: agent.color }}>{agent.name}</span>
          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
        </div>
        <div 
          className={`p-3 rounded-lg ${contentClasses}`}
          style={message.agentId !== 'user' ? { 
            backgroundColor: `${agent.color}10`,
            borderLeft: `3px solid ${agent.color}`
          } : {}}
        >
          {renderMessageContent()}
        </div>
      </div>
    </div>
  );
};

export default AgentMessage;
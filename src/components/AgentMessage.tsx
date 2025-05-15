import React from 'react';
import { Message, Agent } from '../types';
import { getAgentById } from '../data/agents';
import AgentAvatar from './AgentAvatar';
import { ClipboardCheck, User } from 'lucide-react';

interface AgentMessageProps {
  message: Message;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ message }) => {
  const isUserMessage = message.type === 'user-message';
  const agent = isUserMessage ? null : getAgentById(message.agentId);
  
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

  if (isUserMessage) {
    return (
      <div className="flex mb-4 animate-fadeIn justify-end">
        <div className="flex flex-col max-w-[80%] items-end">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
            <span className="font-semibold text-gray-300">You</span>
          </div>
          <div className="p-3 rounded-lg bg-gray-700 border border-gray-600">
            {renderMessageContent()}
          </div>
        </div>
        <div className="ml-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
            <User size={20} className="text-gray-400" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex mb-4 animate-fadeIn">
      <div className="mr-3 flex-shrink-0">
        <AgentAvatar agent={agent} />
      </div>
      <div className="flex flex-col max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold" style={{ color: agent.color }}>{agent.name}</span>
          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
        </div>
        <div 
          className="p-3 rounded-lg"
          style={{ 
            backgroundColor: `${agent.color}10`,
            borderLeft: `3px solid ${agent.color}` 
          }}
        >
          {renderMessageContent()}
        </div>
      </div>
    </div>
  );
};

export default AgentMessage;
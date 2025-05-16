import React, { useEffect, useRef } from 'react';
import { Message, Agent, Task, CampaignMetrics } from '../types';
import AgentMessage from './AgentMessage';
import TypingIndicator from './TypingIndicator';
import TaskList from './TaskList';
import CampaignMetricsPanel from './CampaignMetrics';

interface ChatWindowProps {
  messages: Message[];
  tasks: Task[];
  typingAgent: Agent | null;
  status: 'idle' | 'planning' | 'in-progress' | 'completed';
  metrics?: CampaignMetrics;
}

const defaultMetrics: CampaignMetrics = {
  totalPosts: 0,
  totalLikes: 0,
  totalReplies: 0,
  totalRetweets: 0,
  twitterAccounts: []
};

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  tasks, 
  typingAgent,
  status,
  metrics = defaultMetrics
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingAgent]);

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-xl font-semibold mb-1 bg-gradient-to-r from-[#5370FF] to-[#FF66C5] text-transparent bg-clip-text">推特活动协作</h2>
        <p className="text-gray-300 text-sm">
          观看我们的AI助手协作执行您的推特活动策略。
        </p>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {messages.length === 0 && !typingAgent ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p className="text-center mb-2">暂无消息</p>
                <p className="text-center text-sm">提交活动请求开始对话</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(message => (
                  <AgentMessage key={message.id} message={message} />
                ))}
                {typingAgent && <TypingIndicator agent={typingAgent} />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-64 lg:w-80 border-t md:border-t-0 md:border-l border-gray-700 overflow-hidden flex flex-col min-h-0 bg-gray-800">
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <h3 className="font-medium mb-3 text-gray-200">任务</h3>
            <TaskList tasks={tasks} />
          </div>
        </div>
        
        <CampaignMetricsPanel metrics={metrics} />
      </div>
    </div>
  );
};
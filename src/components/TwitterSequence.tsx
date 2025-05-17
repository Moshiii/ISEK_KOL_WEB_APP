import React, { useState } from 'react';
import { Send, Heart, MessageSquare, Repeat2, UserPlus, ChevronDown, ChevronRight } from 'lucide-react';

interface TwitterAction {
  account: string;
  action_type: 'post' | 'like' | 'reply' | 'retweet' | 'follow';
  target_account: string;
  post_id?: string;
  content?: string;
}

interface TwitterSequenceProps {
  sequence: TwitterAction[];
}

const TwitterSequence: React.FC<TwitterSequenceProps> = ({ sequence }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActionIcon = (type: TwitterAction['action_type']) => {
    switch (type) {
      case 'post':
        return <Send size={16} className="text-[#5370FF]" />;
      case 'like':
        return <Heart size={16} className="text-[#FF66C5]" />;
      case 'reply':
        return <MessageSquare size={16} className="text-[#5370FF]" />;
      case 'retweet':
        return <Repeat2 size={16} className="text-[#FF66C5]" />;
      case 'follow':
        return <UserPlus size={16} className="text-[#5370FF]" />;
    }
  };

  const getActionText = (action: TwitterAction) => {
    switch (action.action_type) {
      case 'post':
        return `发布了推文`;
      case 'like':
        return `点赞了 @${action.target_account} 的推文`;
      case 'reply':
        return `回复了 @${action.target_account}`;
      case 'retweet':
        return `转发了 @${action.target_account} 的推文`;
      case 'follow':
        return `关注了 @${action.target_account}`;
    }
  };

  if (!sequence.length) {
    return <div className="text-gray-400 text-sm italic">暂无推广计划</div>;
  }

  const actionCounts = sequence.reduce((acc, action) => {
    acc[action.action_type] = (acc[action.action_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="gradient-secondary p-4 rounded-lg border border-gray-700 transition-all hover:border-gray-600">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-medium text-gray-200">推广计划概览</h3>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center gap-2">
          <Send size={16} className="text-[#5370FF]" />
          <span className="text-sm text-gray-300">发文 {actionCounts.post || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart size={16} className="text-[#FF66C5]" />
          <span className="text-sm text-gray-300">点赞 {actionCounts.like || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[#5370FF]" />
          <span className="text-sm text-gray-300">回复 {actionCounts.reply || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Repeat2 size={16} className="text-[#FF66C5]" />
          <span className="text-sm text-gray-300">转发 {actionCounts.retweet || 0}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2 pt-4 border-t border-gray-700">
          {sequence.map((action, index) => (
            <div 
              key={index}
              className="p-2 rounded bg-gray-700/30 border border-gray-700"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#5370FF]">@{action.account}</span>
                <div className="flex items-center gap-1 text-gray-300">
                  {getActionIcon(action.action_type)}
                  <span className="text-sm">{getActionText(action)}</span>
                </div>
              </div>
              {action.content && (
                <p className="text-sm text-gray-300 ml-6 mt-1">{action.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TwitterSequence;
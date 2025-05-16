import React from 'react';
import { Send, Heart, MessageSquare, Repeat2, UserPlus } from 'lucide-react';

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

  return (
    <div className="space-y-3">
      {sequence.map((action, index) => (
        <div 
          key={index}
          className="gradient-secondary p-3 rounded-lg border border-gray-700 transition-all hover:border-gray-600"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-[#5370FF]">@{action.account}</span>
            <div className="flex items-center gap-1 text-gray-300">
              {getActionIcon(action.action_type)}
              <span className="text-sm">{getActionText(action)}</span>
            </div>
          </div>
          {action.content && (
            <p className="text-sm text-gray-300 ml-6">{action.content}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default TwitterSequence;
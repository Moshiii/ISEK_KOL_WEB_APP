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
        return <Send size={14} className="text-[#5370FF]" />;
      case 'like':
        return <Heart size={14} className="text-[#FF66C5]" />;
      case 'reply':
        return <MessageSquare size={14} className="text-[#5370FF]" />;
      case 'retweet':
        return <Repeat2 size={14} className="text-[#FF66C5]" />;
      case 'follow':
        return <UserPlus size={14} className="text-[#5370FF]" />;
    }
  };

  const getActionText = (action: TwitterAction) => {
    switch (action.action_type) {
      case 'post':
        return `@${action.account} posted${action.content ? `: ${action.content}` : ''}`;
      case 'like':
        return `@${action.account} liked @${action.target_account}'s tweet`;
      case 'reply':
        return `@${action.account} replied to @${action.target_account}${action.content ? `: ${action.content}` : ''}`;
      case 'retweet':
        return `@${action.account} retweeted @${action.target_account}'s tweet`;
      case 'follow':
        return `@${action.account} followed @${action.target_account}`;
    }
  };

  if (!sequence.length) {
    return <div className="text-gray-400 text-sm italic">No promotion plan yet</div>;
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
        <h3 className="font-medium text-gray-200">Promotion Plan Overview</h3>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center gap-2">
          <Send size={16} className="text-[#5370FF]" />
          <span className="text-sm text-gray-300">Posts {actionCounts.post || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart size={16} className="text-[#FF66C5]" />
          <span className="text-sm text-gray-300">Likes {actionCounts.like || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[#5370FF]" />
          <span className="text-sm text-gray-300">Replies {actionCounts.reply || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Repeat2 size={16} className="text-[#FF66C5]" />
          <span className="text-sm text-gray-300">Retweets {actionCounts.retweet || 0}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-1 pt-4 border-t border-gray-700">
          {sequence.map((action, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 text-sm text-gray-300 py-1"
            >
              {getActionIcon(action.action_type)}
              <span>{getActionText(action)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TwitterSequence;
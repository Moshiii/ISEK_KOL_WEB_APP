import React from 'react';
import { CampaignMetrics as CampaignMetricsType, TwitterAccount } from '../types';
import { MessageSquare, Heart, Repeat2, Send } from 'lucide-react';

interface CampaignMetricsProps {
  metrics?: CampaignMetricsType;
}

const defaultMetrics: CampaignMetricsType = {
  totalPosts: 0,
  totalLikes: 0,
  totalReplies: 0,
  totalRetweets: 0,
  twitterAccounts: []
};

const CampaignMetrics: React.FC<CampaignMetricsProps> = ({ metrics = defaultMetrics }) => {
  return (
    <div className="w-full md:w-64 lg:w-72 border-t md:border-t-0 md:border-l border-gray-700 overflow-hidden flex flex-col min-h-0 bg-gray-800">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h3 className="font-semibold text-lg bg-gradient-to-r from-[#5370FF] to-[#FF66C5] text-transparent bg-clip-text">Campaign Metrics</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="gradient-secondary p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Send size={16} className="text-[#5370FF]" />
              <span className="text-sm text-[#5370FF] font-medium">Posts</span>
            </div>
            <span className="text-xl font-bold text-white">{metrics.totalPosts}</span>
          </div>
          
          <div className="gradient-secondary p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Heart size={16} className="text-[#FF66C5]" />
              <span className="text-sm text-[#FF66C5] font-medium">Likes</span>
            </div>
            <span className="text-xl font-bold text-white">{metrics.totalLikes}</span>
          </div>
          
          <div className="gradient-secondary p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={16} className="text-[#5370FF]" />
              <span className="text-sm text-[#5370FF] font-medium">Replies</span>
            </div>
            <span className="text-xl font-bold text-white">{metrics.totalReplies}</span>
          </div>
          
          <div className="gradient-secondary p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Repeat2 size={16} className="text-[#FF66C5]" />
              <span className="text-sm text-[#FF66C5] font-medium">Retweets</span>
            </div>
            <span className="text-xl font-bold text-white">{metrics.totalRetweets}</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-gray-200">Twitter Accounts</h4>
          {metrics.twitterAccounts.map((account) => (
            <div key={account.handle} className="gradient-secondary p-3 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-[#5370FF]">@{account.handle}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1 text-gray-300">
                  <Send size={14} className="text-[#5370FF]" />
                  <span>{account.postsCount}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <Heart size={14} className="text-[#FF66C5]" />
                  <span>{account.likesCount}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <MessageSquare size={14} className="text-[#5370FF]" />
                  <span>{account.repliesCount}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <Repeat2 size={14} className="text-[#FF66C5]" />
                  <span>{account.retweetsCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampaignMetrics;
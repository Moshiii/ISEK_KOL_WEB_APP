import { useState, useEffect } from 'react';
import { Message, Task, Campaign, Agent, CampaignMetrics } from '../types';
import { agents, getAgentById } from '../data/agents';
import { createCampaign, sendUserMessage } from '../api';

const TWITTER_HANDLES = [
  'tech_influencer',
  'digital_marketer',
  'social_guru',
  'content_creator'
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const initialMetrics: CampaignMetrics = {
  totalPosts: 0,
  totalLikes: 0,
  totalReplies: 0,
  totalRetweets: 0,
  twitterAccounts: []
};

// Helper function to add delay between actions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useChatSimulation() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [typingAgent, setTypingAgent] = useState<Agent | null>(null);
  const [status, setStatus] = useState<'idle' | 'planning' | 'in-progress' | 'completed'>('idle');
  const [metrics, setMetrics] = useState<CampaignMetrics>(initialMetrics);

  const resetChat = () => {
    setCampaign(null);
    setMessages([]);
    setTasks([]);
    setTypingAgent(null);
    setStatus('idle');
    setMetrics(initialMetrics);
  };

  const updateMetrics = () => {
    setMetrics(prev => {
      const newAccounts = [...prev.twitterAccounts];
      
      if (Math.random() > 0.7 && newAccounts.length < TWITTER_HANDLES.length) {
        const unusedHandles = TWITTER_HANDLES.filter(
          handle => !newAccounts.some(acc => acc.handle === handle)
        );
        if (unusedHandles.length > 0) {
          const newHandle = unusedHandles[Math.floor(Math.random() * unusedHandles.length)];
          newAccounts.push({
            handle: newHandle,
            postsCount: 0,
            likesCount: 0,
            repliesCount: 0,
            retweetsCount: 0
          });
        }
      }

      const updatedAccounts = newAccounts.map(account => ({
        ...account,
        postsCount: account.postsCount + Math.floor(Math.random() * 2),
        likesCount: account.likesCount + Math.floor(Math.random() * 5),
        repliesCount: account.repliesCount + Math.floor(Math.random() * 3),
        retweetsCount: account.retweetsCount + Math.floor(Math.random() * 2)
      }));

      const totals = updatedAccounts.reduce((acc, account) => ({
        totalPosts: acc.totalPosts + account.postsCount,
        totalLikes: acc.totalLikes + account.likesCount,
        totalReplies: acc.totalReplies + account.repliesCount,
        totalRetweets: acc.totalRetweets + account.retweetsCount
      }), {
        totalPosts: 0,
        totalLikes: 0,
        totalReplies: 0,
        totalRetweets: 0
      });

      return {
        ...totals,
        twitterAccounts: updatedAccounts
      };
    });
  };

  const addUserMessage = (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      agentId: 'user',
      content,
      timestamp: new Date(),
      type: 'message'
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const addMessageWithDelay = async (message: Message) => {
    setTypingAgent(getAgentById(message.agentId));
    await delay(Math.random() * 1000 + 500); // Random delay between 500-1500ms
    setMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
    setTypingAgent(null);
  };

  const addTaskWithDelay = async (task: Task) => {
    await delay(Math.random() * 1000 + 500); // Random delay between 500-1500ms
    setTasks(prev => [...prev, task]);
    
    const agent = getAgentById(task.assignedTo);
    const taskMessage = {
      id: generateId(),
      agentId: 'coordinator',
      content: `<strong>${agent.name}</strong> 将负责 <strong>${task.title}</strong>：${task.description}`,
      timestamp: new Date(),
      type: 'task-assignment' as const,
      taskId: task.id
    };
    await addMessageWithDelay(taskMessage);
  };

  const startCampaign = async (request: string) => {
    try {
      resetChat();
      setStatus('planning');
      
      // Immediately show user message
      addUserMessage(request);
      setTypingAgent(getAgentById('coordinator'));
      
      const result = await createCampaign(request);
      
      if (result.status === 'success') {
        const { campaign: newCampaign } = result;
        
        setCampaign(newCampaign);

        // Add coordinator's initial response
        const coordinatorMessages = newCampaign.messages
          .filter(msg => msg.agentId === 'coordinator' && msg.type === 'message');
        
        for (const msg of coordinatorMessages) {
          await addMessageWithDelay({
            ...msg,
            timestamp: new Date(msg.timestamp)
          });
        }
      }
    } catch (error) {
      console.error('Failed to start campaign:', error);
      setTypingAgent(null);
      throw error;
    }
  };

  const sendMessage = async (content: string) => {
    if (!campaign) return;
    
    try {
      // Immediately show user message
      addUserMessage(content);
      setTypingAgent(getAgentById('coordinator'));
      
      const updatedCampaign = await sendUserMessage(campaign.id, content);
      
      setCampaign(updatedCampaign);

      // Add new messages sequentially
      const newMessages = updatedCampaign.messages
        .filter(msg => msg.agentId !== 'user' && !messages.some(m => m.id === msg.id));

      for (const msg of newMessages) {
        await addMessageWithDelay({
          ...msg,
          timestamp: new Date(msg.timestamp)
        });
      }
      
      if (updatedCampaign.tasks && updatedCampaign.info_gathering_complete) {
        setStatus('in-progress');
        
        // Add tasks sequentially
        for (const task of updatedCampaign.tasks) {
          await addTaskWithDelay({
            ...task,
            createdAt: new Date(task.createdAt)
          });
        }
        
        const metricsInterval = setInterval(updateMetrics, 3000);
        return () => clearInterval(metricsInterval);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setTypingAgent(null);
      throw error;
    }
  };

  return {
    messages,
    tasks,
    typingAgent,
    status,
    metrics,
    startCampaign,
    sendMessage,
    resetChat
  };
}
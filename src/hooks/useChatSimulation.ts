import { useState, useEffect } from 'react';
import { Message, Task, Campaign, Agent, CampaignMetrics } from '../types';
import { getAgentById } from '../data/agents';

const PROGRESS_MESSAGES = [
  "让我思考一下最佳的执行方案...",
  "正在分析市场趋势和目标受众...",
  "正在评估不同策略的可行性...",
  "正在设计任务分配方案...",
  "正在制定详细的执行计划...",
  "正在考虑各种可能的营销角度...",
  "正在规划时间线和里程碑...",
  "正在评估资源分配方案...",
  "正在思考如何最大化活动效果...",
  "正在制定具体的实施步骤..."
];

const TWITTER_HANDLES = [
  'tech_influencer',
  'digital_marketer',
  'social_guru',
  'content_creator'
];

const initialMetrics: CampaignMetrics = {
  totalPosts: 0,
  totalLikes: 0,
  totalReplies: 0,
  totalRetweets: 0,
  twitterAccounts: []
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getRandomDelay = () => Math.random() * 500 + 500; // 500-1000ms

export function useChatSimulation() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [typingAgent, setTypingAgent] = useState<Agent | null>(null);
  const [status, setStatus] = useState<'idle' | 'planning' | 'in-progress' | 'completed'>('idle');
  const [metrics, setMetrics] = useState<CampaignMetrics>(initialMetrics);
  const [metricsInterval, setMetricsInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (metricsInterval) {
        clearInterval(metricsInterval);
      }
    };
  }, [metricsInterval]);

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

  const addMessage = async (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const addProgressMessage = async () => {
    const message = {
      id: generateId(),
      agentId: 'coordinator',
      content: PROGRESS_MESSAGES[Math.floor(Math.random() * PROGRESS_MESSAGES.length)],
      timestamp: new Date(),
      type: 'message'
    };
    setTypingAgent(getAgentById('coordinator'));
    await delay(getRandomDelay());
    await addMessage(message);
    setTypingAgent(null);
  };

  const startCampaign = async (request: string) => {
    try {
      // Show user message immediately
      const userMessage = {
        id: generateId(),
        agentId: 'user',
        content: request,
        timestamp: new Date(),
        type: 'message'
      };
      await addMessage(userMessage);

      // Show progress message
      await addProgressMessage();

      // Get campaign plan
      const response = await fetch('http://localhost:8000/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request })
      });
      
      const result = await response.json();
      setCampaign(result.campaign);

      // Show plan
      const planMessage = {
        id: generateId(),
        agentId: 'coordinator',
        content: result.campaign.messages[0].content,
        timestamp: new Date(),
        type: 'message'
      };
      await addMessage(planMessage);

      // Show confirmation request
      await addMessage({
        id: generateId(),
        agentId: 'coordinator',
        content: '您觉得这个方案怎么样？如果同意，请回复"确认"开始执行。',
        timestamp: new Date(),
        type: 'message'
      });
    } catch (error) {
      console.error('Error:', error);
      setTypingAgent(null);
    }
  };

  const sendMessage = async (content: string) => {
    if (!campaign || content.trim().toLowerCase() !== '确认') {
      await addMessage({
        id: generateId(),
        agentId: 'coordinator',
        content: '请回复"确认"以开始执行推广计划。',
        timestamp: new Date(),
        type: 'message'
      });
      return;
    }

    try {
      // Show user confirmation
      await addMessage({
        id: generateId(),
        agentId: 'user',
        content,
        timestamp: new Date(),
        type: 'message'
      });

      // Show progress message
      await addProgressMessage();

      // Get team
      const teamResponse = await fetch(`http://localhost:8000/api/campaign/${campaign.id}/team`);
      const { team } = await teamResponse.json();

      // Show team introductions
      for (const member of team) {
        await delay(getRandomDelay());
        await addMessage({
          id: generateId(),
          agentId: member.id,
          content: member.introduction,
          timestamp: new Date(),
          type: 'message'
        });
      }

      // Show progress message
      await addProgressMessage();

      // Get tasks
      const tasksResponse = await fetch(`http://localhost:8000/api/campaign/${campaign.id}/tasks`);
      const { tasks: newTasks } = await tasksResponse.json();
      setTasks(newTasks);

      // Show task assignments
      for (const task of newTasks) {
        const agent = getAgentById(task.assignedTo);
        await delay(getRandomDelay());
        await addMessage({
          id: generateId(),
          agentId: 'coordinator',
          content: `${agent.name} 将负责 ${task.title}：${task.description}`,
          timestamp: new Date(),
          type: 'task-assignment',
          taskId: task.id
        });
      }

      // Get promotion plan
      const promotionResponse = await fetch(`http://localhost:8000/api/campaign/${campaign.id}/promotion`);
      const { plan } = await promotionResponse.json();

      // Show promotion plan
      await addProgressMessage();
      await addMessage({
        id: generateId(),
        agentId: 'coordinator',
        content: '我们已经制定了详细的推广计划，包括多个账号的协同推广策略。现在开始执行！',
        timestamp: new Date(),
        type: 'message'
      });

      setStatus('in-progress');

      // Start updating metrics
      const interval = setInterval(updateMetrics, getRandomDelay());
      setMetricsInterval(interval);
    } catch (error) {
      console.error('Error:', error);
      setTypingAgent(null);
    }
  };

  return {
    messages,
    tasks,
    typingAgent,
    status,
    metrics,
    startCampaign,
    sendMessage
  };
};
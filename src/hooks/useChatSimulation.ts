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

const AGENT_TASK_MESSAGES = {
  researcher: [
    "我已经开始进行市场研究，重点关注目标受众的行为特征和偏好。",
    "正在分析竞品的社交媒体策略，寻找差异化机会。",
    "市场调研完成！我发现了几个很有价值的营销切入点。"
  ],
  writer: [
    "我正在设计内容框架，确保每条推文都能引起共鸣。",
    "正在撰写一系列吸引人的推文，融入关键信息点。",
    "内容创作完成！我们有一个完整的推文发布计划了。"
  ],
  designer: [
    "我在设计视觉主题，确保与品牌调性一致。",
    "正在创作吸引眼球的配图和动画效果。",
    "设计工作完成！所有视觉元素都准备就绪。"
  ]
};

const TWITTER_ACTION_MESSAGES = {
  post: (account: string, content: string) => 
    `${account} 发布了推文：${content}`,
  like: (account: string, target: string) => 
    `${account} 点赞了 ${target} 的推文`,
  reply: (account: string, target: string, content: string) => 
    `${account} 回复了 ${target}：${content}`,
  retweet: (account: string, target: string) => 
    `${account} 转发了 ${target} 的推文`,
  follow: (account: string, target: string) => 
    `${account} 关注了 ${target}`
};

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
  const [metricsUpdateCount, setMetricsUpdateCount] = useState(0);
  const [metricsInterval, setMetricsInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (metricsInterval) {
        clearInterval(metricsInterval);
      }
    };
  }, [metricsInterval]);

  useEffect(() => {
    if (metricsUpdateCount >= 10 && metricsInterval) {
      clearInterval(metricsInterval);
      setMetricsInterval(null);
    }
  }, [metricsUpdateCount, metricsInterval]);

  const updateMetrics = () => {
    setMetricsUpdateCount(prev => prev + 1);
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

  const addAgentMessage = async (agentId: string, content: string, type: Message['type'] = 'message', taskId?: string) => {
    setTypingAgent(getAgentById(agentId));
    await delay(getRandomDelay());
    await addMessage({
      id: generateId(),
      agentId,
      content,
      timestamp: new Date(),
      type,
      taskId
    });
    setTypingAgent(null);
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status } : task
    ));
  };

  const executeAgentTask = async (task: Task) => {
    const messages = AGENT_TASK_MESSAGES[task.assignedTo as keyof typeof AGENT_TASK_MESSAGES];
    
    // Start task
    await updateTaskStatus(task.id, 'in-progress');
    await addAgentMessage(task.assignedTo, messages[0]);
    await delay(getRandomDelay());
    
    // Progress update
    await addAgentMessage(task.assignedTo, messages[1]);
    await delay(getRandomDelay());
    
    // Complete task
    await updateTaskStatus(task.id, 'completed');
    await addAgentMessage(task.assignedTo, messages[2]);
  };

  const startCampaign = async (request: string) => {
    try {
      // Show user message immediately
      await addMessage({
        id: generateId(),
        agentId: 'user',
        content: request,
        timestamp: new Date(),
        type: 'message'
      });

      // Show coordinator thinking
      await addAgentMessage('coordinator', PROGRESS_MESSAGES[Math.floor(Math.random() * PROGRESS_MESSAGES.length)]);

      // Get campaign plan
      const response = await fetch('http://localhost:8000/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request })
      });
      
      const result = await response.json();
      setCampaign(result.campaign);

      // Show plan
      await addAgentMessage('coordinator', result.campaign.messages[0].content);

      // Show confirmation request
      await addAgentMessage('coordinator', '您觉得这个方案怎么样？如果同意，请回复"确认"开始执行。');
    } catch (error) {
      console.error('Error:', error);
      setTypingAgent(null);
    }
  };

  const sendMessage = async (content: string) => {
    if (!campaign) return;

    // Show user message immediately
    await addMessage({
      id: generateId(),
      agentId: 'user',
      content,
      timestamp: new Date(),
      type: 'message'
    });

    if (content.trim() !== '确认') {
      await addAgentMessage('coordinator', '请回复"确认"以开始执行推广计划。');
      return;
    }

    try {
      // Get team
      const teamResponse = await fetch(`http://localhost:8000/api/campaign/${campaign.id}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const { team } = await teamResponse.json();

      // Show team introductions
      for (const member of team) {
        await addAgentMessage(member.id, member.introduction);
      }

      // Get tasks
      const tasksResponse = await fetch(`http://localhost:8000/api/campaign/${campaign.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const { tasks: newTasks } = await tasksResponse.json();
      setTasks(newTasks);

      // Show task assignments and execute tasks
      for (const task of newTasks) {
        const agent = getAgentById(task.assignedTo);
        await addAgentMessage('coordinator', `${agent.name} 将负责 ${task.title}：${task.description}`, 'task-assignment', task.id);
        await executeAgentTask(task);
      }

      // Get Twitter sequence
      const sequenceResponse = await fetch(`http://localhost:8000/api/campaign/${campaign.id}/twitter-sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const { sequence } = await sequenceResponse.json();

      // Show Twitter sequence plan
      await addAgentMessage('coordinator', '我们已经制定了详细的推广计划，以下是具体的执行步骤：');
      
      for (const action of sequence) {
        const message = TWITTER_ACTION_MESSAGES[action.action_type as keyof typeof TWITTER_ACTION_MESSAGES](
          action.account,
          action.target_account || action.account,
          action.content || ''
        );
        await addAgentMessage('coordinator', message);
      }

      await addAgentMessage('coordinator', '这是我们的推广计划，您觉得如何？如果同意，我们就开始执行。');

      // Confirm campaign
      const confirmResponse = await fetch(`http://localhost:8000/api/campaign/${campaign.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (confirmResponse.ok) {
        // Start campaign execution
        await addAgentMessage('coordinator', '太好了！我们现在开始执行推广计划。');
        setStatus('in-progress');

        // Start updating metrics
        const interval = setInterval(updateMetrics, getRandomDelay());
        setMetricsInterval(interval);
      }
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
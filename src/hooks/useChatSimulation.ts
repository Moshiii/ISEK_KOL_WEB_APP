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
  user: [
    "我已经准备好参与本次推广活动。",
    "正在积极配合团队推进任务。"
  ],
  coordinator: [
    "我正在协调各方资源，确保推广计划顺利进行。",
    "正在跟进各成员的任务进度，确保按时完成。"
  ],
  researcher: [
    "我已经开始进行市场研究，重点关注目标受众的行为特征和偏好。",
    "正在分析竞品的社交媒体策略，寻找差异化机会。"
  ],
  writer: [
    "我正在设计内容框架，确保每条推文都能引起共鸣。",
    "正在撰写一系列吸引人的推文，融入关键信息点。"
  ],
  designer: [
    "我在设计视觉主题，确保与品牌调性一致。",
    "正在创作吸引眼球的配图和动画效果。"
  ],
  developer: [
    "我正在开发相关的推广工具和自动化脚本。",
    "正在优化系统性能，确保活动顺利进行。"
  ],
  editor: [
    "我正在审核和润色所有内容，确保表达准确无误。",
    "正在校对推文，保证语法和风格统一。"
  ],
  photographer: [
    "我正在拍摄高质量的活动照片。",
    "正在挑选最佳照片用于社交媒体发布。"
  ],
  videographer: [
    "我正在录制和剪辑活动视频素材。",
    "正在制作精彩的短视频以提升传播效果。"
  ],
  strategist: [
    "我正在制定整体推广策略，确保目标达成。",
    "正在评估不同渠道的投放效果，优化资源分配。"
  ],
  analyst: [
    "我正在收集和分析数据，评估活动效果。",
    "正在生成数据报告，为后续优化提供依据。"
  ],
  community_manager: [
    "我正在与社区成员互动，提升用户参与度。",
    "正在解答用户疑问，维护良好社区氛围。"
  ],
  influencer: [
    "我正在准备个人社交账号的推广内容。",
    "正在与粉丝互动，扩大活动影响力。"
  ],
  advisor: [
    "我正在为团队提供专业建议，规避潜在风险。",
    "正在审核推广方案，确保符合行业规范。"
  ],
  security: [
    "我正在检查活动的安全隐患，保障数据安全。",
    "正在监控系统运行，防止异常行为发生。"
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
  const [metricsInterval, setMetricsInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [twitterSequence, setTwitterSequence] = useState<any[]>([]);

  useEffect(() => {
    return () => {
      if (metricsInterval) {
        clearInterval(metricsInterval);
      }
    };
  }, [metricsInterval]);

  useEffect(() => {
    if (metricsUpdateCount >= 20 && metricsInterval) {
      clearInterval(metricsInterval);
      setMetricsInterval(null);
      setStatus('completed');
    }
  }, [metricsUpdateCount, metricsInterval]);

  const updateMetricsForAction = (action: any) => {
    setMetrics(prev => {
      const newAccounts = [...prev.twitterAccounts];
      let account = newAccounts.find(acc => acc.handle === action.account);
      
      if (!account) {
        account = {
          handle: action.account,
          postsCount: 0,
          likesCount: 0,
          repliesCount: 0,
          retweetsCount: 0
        };
        newAccounts.push(account);
      }

      switch (action.action_type) {
        case 'post':
          account.postsCount += 1;
          break;
        case 'like':
          account.likesCount += 1;
          break;
        case 'reply':
          account.repliesCount += 1;
          break;
        case 'retweet':
          account.retweetsCount += 1;
          break;
      }

      const totals = newAccounts.reduce((acc, account) => ({
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
        twitterAccounts: newAccounts
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
    
    // Complete task - get completion message from backend
    const apiPromise = await fetch(`http://localhost:8000/api/campaign/${campaign?.id}/task/${task.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'completed'
      })
    });

    // While waiting for the API, show progress messages
    setTypingAgent(getAgentById(task.assignedTo));
    for (let i = 0; i < 3; i++) {
      await addAgentMessage(
        task.assignedTo, 
        PROGRESS_MESSAGES[Math.floor(Math.random() * PROGRESS_MESSAGES.length)]
      );
    }

    const response = await apiPromise;
    const result = await response.json();
    await updateTaskStatus(task.id, result.taskStatus);
    await addAgentMessage(task.assignedTo, result.result);
  };

  const startCampaign = async (request: string) => {
    try {
      // First add the user's message
      await addMessage({
        id: generateId(),
        agentId: 'user',
        content: request,
        timestamp: new Date(),
        type: 'message'
      });

      // Start the API call immediately
      const apiPromise = fetch('http://localhost:8000/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request })
      });

      // While waiting for the API, show progress messages
      setTypingAgent(getAgentById('coordinator'));
      for (let i = 0; i < 2; i++) {
        await addAgentMessage(
          'coordinator', 
          PROGRESS_MESSAGES[Math.floor(Math.random() * PROGRESS_MESSAGES.length)]
        );
      }

      // Now await the API response
      const response = await apiPromise;
      const result = await response.json();
      setCampaign(result.campaign);
      setTypingAgent(null);

      // Show the campaign plan
      await addAgentMessage('coordinator', result.campaign.messages[0].content);
      await addAgentMessage('coordinator', '您觉得这个方案怎么样？如果同意，请回复"确认"开始执行。');
    } catch (error) {
      console.error('Error:', error);
      setTypingAgent(null);
      await addAgentMessage('coordinator', '抱歉，处理您的请求时出现了错误。请稍后重试。');
    }
  };

  const sendMessage = async (content: string) => {
    if (!campaign) return;

    await addMessage({
      id: generateId(),
      agentId: 'user',
      content,
      timestamp: new Date(),
      type: 'message'
    });

    try {
      if (!awaitingConfirmation) {
        if (content.trim() !== '确认') {
          await addAgentMessage('coordinator', '请回复"确认"以开始执行推广计划。');
          return;
        }

        // Start the team API call immediately
        const teamPromise = fetch(`http://localhost:8000/api/campaign/${campaign.id}/team`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            campaignPlan: campaign.messages[0].content 
          })
        });

        // Show progress while waiting
        setTypingAgent(getAgentById('coordinator'));
        await addAgentMessage('coordinator', PROGRESS_MESSAGES[Math.floor(Math.random() * PROGRESS_MESSAGES.length)]);

        const teamResponse = await teamPromise;
        const { team } = await teamResponse.json();
        setTypingAgent(null);

        // Introduce team members while starting tasks API call
        const tasksPromise = fetch(`http://localhost:8000/api/campaign/${campaign.id}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            campaignPlan: campaign.messages[0].content,
            teamPlan: team
          })
        });

        // Introduce each team member while waiting for tasks
        if (Array.isArray(team)) {
          for (const member of team) {
            await addAgentMessage(member.id, member.introduction);
          }
        }

        const tasksResponse = await tasksPromise;
        const { tasks: newTasks } = await tasksResponse.json();
        
        // Add and execute tasks
        for (const task of newTasks) {
          const agent = getAgentById(task.assignedTo);
          await addAgentMessage('coordinator', `${agent.name} 将负责 ${task.title}：${task.description}`, 'task-assignment', task.id);
          setTasks(prev => [...prev, task]);
          await delay(500);
          await executeAgentTask(task);
        }

        // Start sequence API call while showing progress
        const sequencePromise = fetch(`http://localhost:8000/api/campaign/${campaign.id}/twitter-sequence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });

        await addAgentMessage('coordinator', PROGRESS_MESSAGES[Math.floor(Math.random() * PROGRESS_MESSAGES.length)]);

        const sequenceResponse = await sequencePromise;
        const { sequence } = await sequenceResponse.json();
        setTwitterSequence(sequence);

        await addAgentMessage('coordinator', '我们已经制定了详细的推广计划在右侧的任务栏中');
        await addAgentMessage('coordinator', '如果同意推广计划,请再次回复"确认"开始执行。');
        setAwaitingConfirmation(true);
      } else {
        if (content.trim() !== '确认') {
          await addAgentMessage('coordinator', '如果您同意这个推广计划，请回复"确认"开始执行。');
          return;
        }
        if (metricsInterval) {
          clearInterval(metricsInterval);
        }

        const confirmResponse = await fetch(`http://localhost:8000/api/campaign/${campaign.id}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });

        if (confirmResponse.ok) {
          await addAgentMessage('coordinator', '太好了！我们现在开始执行推广计划。');
          setStatus('in-progress');
          setMetricsUpdateCount(0);

          // Execute promotion sequence and update metrics
          for (const action of twitterSequence) {
            const message = TWITTER_ACTION_MESSAGES[action.action_type as keyof typeof TWITTER_ACTION_MESSAGES](
              action.account,
              action.target_account || action.account,
              action.content || ''
            );
            await addAgentMessage('coordinator', message);
            updateMetricsForAction(action);
            await delay(500);
          }

          // Continue random growth for a while
          const interval = setInterval(() => {
            setMetricsUpdateCount(prev => prev + 1);
            setMetrics(prev => {
              const newAccounts = prev.twitterAccounts.map(account => ({
                ...account,
                likesCount: account.likesCount + Math.floor(Math.random() * 2),
                retweetsCount: account.retweetsCount + Math.floor(Math.random() * 1)
              }));

              const totals = newAccounts.reduce((acc, account) => ({
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
                twitterAccounts: newAccounts
              };
            });
          }, 500);
          setMetricsInterval(interval);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setTypingAgent(null);
      await addAgentMessage('coordinator', '抱歉，处理您的请求时出现了错误。请稍后重试。');
    }
  };

  return {
    messages,
    tasks,
    typingAgent,
    status,
    metrics,
    twitterSequence,
    startCampaign,
    sendMessage
  };
}
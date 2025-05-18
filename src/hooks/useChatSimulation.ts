import { useState, useEffect } from 'react';
import { Message, Task, Campaign, Agent, CampaignMetrics } from '../types';
import { getAgentById } from '../data/agents';

const PROGRESS_MESSAGES = [
  "Let me think about the best execution plan...",
  "Analyzing market trends and target audience...",
  "Evaluating the feasibility of different strategies...",
  "Designing the task allocation plan...",
  "Developing a detailed execution plan...",
  "Considering various possible marketing angles...",
  "Planning the timeline and milestones...",
  "Assessing resource allocation plan...",
  "Thinking about how to maximize campaign effectiveness...",
  "Formulating specific implementation steps..."
];

const TWITTER_HANDLES = [
  'tech_influencer',
  'digital_marketer',
  'social_guru',
  'content_creator'
];

const AGENT_TASK_MESSAGES = {
  researcher: [
    "I've started conducting market research, focusing on the behavioral characteristics and preferences of the target audience.",
    "Analyzing competitors' social media strategies to find differentiation opportunities."
  ],
  writer: [
    "I'm designing the content framework to ensure every tweet resonates.",
    "Writing a series of engaging tweets, incorporating key information points."
  ],
  designer: [
    "I'm designing the visual theme to ensure consistency with the brand tone.",
    "Creating eye-catching graphics and animation effects."
  ]
};

const TWITTER_ACTION_MESSAGES = {
  post: (account: string, content: string) => 
    `${account} posted a tweet: ${content}`,
  like: (account: string, target: string) => 
    `${account} liked a tweet by ${target}`,
  reply: (account: string, target: string, content: string) => 
    `${account} replied to ${target}: ${content}`,
  retweet: (account: string, target: string) => 
    `${account} retweeted a tweet by ${target}`,
  follow: (account: string, target: string) => 
    `${account} followed ${target}`
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
      // First, add the user's message
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
      for (let i = 0; i < 3; i++) {
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
      await addAgentMessage('coordinator', 'What do you think of this plan? If you agree, please reply with "confirm" to start execution.');
    } catch (error) {
      console.error('Error:', error);
      setTypingAgent(null);
      await addAgentMessage('coordinator', 'Sorry, there was an error processing your request. Please try again later.');
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
      if (content.trim() !== 'confirm') {
        await addAgentMessage('coordinator', 'Please reply with "confirm" to start executing the promotion plan.');
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
        await addAgentMessage('coordinator', `${agent.name} will be responsible for ${task.title}: ${task.description}`, 'task-assignment', task.id);
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

      await addAgentMessage('coordinator', 'We have created a detailed promotion plan, which you can view in the task panel on the right.');
      await addAgentMessage('coordinator', 'If you agree with the promotion plan, please reply "confirm" again to start execution.');
      setAwaitingConfirmation(true);
      } else {
      if (content.trim() !== 'confirm') {
        await addAgentMessage('coordinator', 'If you agree with this promotion plan, please reply "confirm" to start execution.');
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
        await addAgentMessage('coordinator', 'Great! We are now starting to execute the promotion plan.');
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
      await addAgentMessage('coordinator', 'Sorry, there was an error processing your request. Please try again later.');
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
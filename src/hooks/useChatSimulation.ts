import { useState } from 'react';
import { Message, Task, Campaign, Agent } from '../types';
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

      // Show progress message
      await addProgressMessage();

      // Get team
      const teamResponse = await fetch(`http://localhost:8000/api/campaign/${result.campaign.id}/team`);
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
      const tasksResponse = await fetch(`http://localhost:8000/api/campaign/${result.campaign.id}/tasks`);
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
      const promotionResponse = await fetch(`http://localhost:8000/api/campaign/${result.campaign.id}/promotion`);
      const { plan } = await promotionResponse.json();

      // Show promotion plan
      await addProgressMessage();
      await addMessage({
        id: generateId(),
        agentId: 'coordinator',
        content: '我们已经制定了详细的推广计划，包括多个账号的协同推广策略。',
        timestamp: new Date(),
        type: 'message'
      });

      setStatus('in-progress');
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
    startCampaign
  };
}
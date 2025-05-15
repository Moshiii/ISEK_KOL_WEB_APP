import { useState, useEffect } from 'react';
import { Message, Task, Campaign, Agent, CampaignMetrics, CampaignDetails } from '../types';
import { agents, getAgentById } from '../data/agents';
import { createCampaign } from '../api';

const TWITTER_HANDLES = [
  'tech_influencer',
  'digital_marketer',
  'social_guru',
  'content_creator'
];

const CAMPAIGN_QUESTIONS = [
  {
    id: 'slogan',
    question: "请分享您的活动口号或主要信息是什么？",
    field: 'slogan'
  },
  {
    id: 'productDescription',
    question: "能详细描述一下您的产品或服务吗？",
    field: 'productDescription'
  },
  {
    id: 'targetAudience',
    question: "您的目标受众是谁？请描述他们的特征和兴趣。",
    field: 'targetAudience'
  },
  {
    id: 'expectedMetrics',
    question: "您对这次活动有什么具体的期望目标吗？比如互动数量、转发数等。",
    field: 'expectedMetrics'
  }
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

export function useChatSimulation() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [typingAgent, setTypingAgent] = useState<Agent | null>(null);
  const [status, setStatus] = useState<'idle' | 'planning' | 'in-progress' | 'completed'>('idle');
  const [metrics, setMetrics] = useState<CampaignMetrics>(initialMetrics);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails>({});

  const resetChat = () => {
    setCampaign(null);
    setMessages([]);
    setTasks([]);
    setTypingAgent(null);
    setStatus('idle');
    setMetrics(initialMetrics);
    setCurrentQuestionIndex(-1);
    setCampaignDetails({});
  };

  const addMessage = (content: string, type: Message['type'] = 'message', agentId: string = 'coordinator') => {
    const newMessage: Message = {
      id: generateId(),
      agentId,
      content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleUserResponse = (response: string) => {
    // Add user's message to chat
    addMessage(response, 'user-message', 'user');

    // Update campaign details based on current question
    const currentQuestion = CAMPAIGN_QUESTIONS[currentQuestionIndex];
    setCampaignDetails(prev => ({
      ...prev,
      [currentQuestion.field]: response
    }));

    // Move to next question or start campaign
    if (currentQuestionIndex < CAMPAIGN_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      
      // Add Alex's next question after a delay
      setTimeout(() => {
        setTypingAgent(getAgentById('coordinator'));
        setTimeout(() => {
          addMessage(CAMPAIGN_QUESTIONS[currentQuestionIndex + 1].question);
          setTypingAgent(null);
        }, 1500);
      }, 1000);
    } else {
      // Start the campaign with gathered details
      initiateMainCampaign();
    }
  };

  const initiateMainCampaign = async () => {
    try {
      setStatus('planning');
      
      const result = await createCampaign(JSON.stringify({
        request: messages[0].content,
        details: campaignDetails
      }));
      
      if (result.status === 'success') {
        const { campaign: newCampaign } = result;
        
        setCampaign(newCampaign);
        setMessages(prev => [
          ...prev,
          ...newCampaign.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        ]);
        setTasks(newCampaign.tasks.map(task => ({
          ...task,
          createdAt: new Date(task.createdAt)
        })));
        
        setStatus('in-progress');
        
        const metricsInterval = setInterval(updateMetrics, 3000);
        
        let taskIndex = 0;
        const progressTasks = () => {
          if (taskIndex < newCampaign.tasks.length) {
            const currentTask = newCampaign.tasks[taskIndex];
            
            setTasks(prev => 
              prev.map(t => 
                t.id === currentTask.id 
                  ? {...t, status: 'in-progress'} 
                  : t
              )
            );
            
            const agent = getAgentById(currentTask.assignedTo);
            setTypingAgent(agent);
            
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: generateId(),
                agentId: agent.id,
                content: `我开始执行${currentTask.title}任务。`,
                timestamp: new Date(),
                type: 'message',
                taskId: currentTask.id
              }]);
              setTypingAgent(null);
              
              setTimeout(() => {
                setTasks(prev => 
                  prev.map(t => 
                    t.id === currentTask.id 
                      ? {...t, status: 'completed'} 
                      : t
                  )
                );
                
                setTypingAgent(agent);
                setTimeout(() => {
                  setMessages(prev => [...prev, {
                    id: generateId(),
                    agentId: agent.id,
                    content: getTaskCompletionDetail(currentTask),
                    timestamp: new Date(),
                    type: 'message',
                    taskId: currentTask.id
                  }]);
                  setTypingAgent(null);
                  
                  taskIndex++;
                  if (taskIndex < newCampaign.tasks.length) {
                    setTimeout(progressTasks, 2000);
                  } else {
                    setTimeout(() => {
                      setTypingAgent(getAgentById('coordinator'));
                      setTimeout(() => {
                        setMessages(prev => [...prev, {
                          id: generateId(),
                          agentId: 'coordinator',
                          content: "太棒了！所有任务都已完成。推特活动已准备就绪，可以开始执行了。",
                          timestamp: new Date(),
                          type: 'message'
                        }]);
                        setTypingAgent(null);
                        setStatus('completed');
                        clearInterval(metricsInterval);
                      }, 2000);
                    }, 1000);
                  }
                }, 1000);
              }, 5000);
            }, 1000);
          }
        };
        
        progressTasks();
      }
    } catch (error) {
      console.error('Failed to start campaign:', error);
      throw error;
    }
  };

  const startCampaign = (request: string) => {
    resetChat();
    
    // Add user's initial request to messages
    addMessage(request, 'user-message', 'user');
    
    // Start the conversation with Alex
    setTimeout(() => {
      setTypingAgent(getAgentById('coordinator'));
      setTimeout(() => {
        addMessage("感谢您的请求！为了更好地规划这次推特活动，我需要了解一些具体细节。");
        setTypingAgent(null);
        
        setTimeout(() => {
          setTypingAgent(getAgentById('coordinator'));
          setTimeout(() => {
            setCurrentQuestionIndex(0);
            addMessage(CAMPAIGN_QUESTIONS[0].question);
            setTypingAgent(null);
          }, 1500);
        }, 1000);
      }, 1500);
    }, 1000);
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

  const getTaskCompletionDetail = (task: Task): string => {
    switch (task.title) {
      case '受众分析':
        return "数据显示目标群体有很强的互动潜力。";
      case '内容策略':
        return "推文计划和内容主题已优化以获得最大覆盖。";
      case '推文文案':
        return "引人入胜的推文已准备好在我们的推特网络中发布。";
      case '视觉设计':
        return "吸引眼球的视觉内容已准备就绪，将提升推文互动率。";
      default:
        return "任务已成功完成。";
    }
  };

  return {
    messages,
    tasks,
    typingAgent,
    status,
    metrics,
    startCampaign,
    handleUserResponse,
    resetChat
  };
}
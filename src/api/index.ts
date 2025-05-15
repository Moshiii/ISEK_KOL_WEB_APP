import { Campaign, CampaignMetrics, Task } from '../types';

const API_URL = 'http://localhost:8000/api';

export async function createCampaign(request: string): Promise<{
  status: string;
  message: string;
  campaign: Campaign;
}> {
  const response = await fetch(`${API_URL}/campaign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ request }),
  });

  if (!response.ok) {
    throw new Error('Failed to create campaign');
  }

  return response.json();
}

export async function sendUserMessage(campaignId: string, content: string): Promise<Campaign> {
  const response = await fetch(`${API_URL}/campaign/${campaignId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  const response = await fetch(`${API_URL}/campaign/${campaignId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch campaign');
  }
  
  return response.json();
}

export async function getCampaignTasks(campaignId: string): Promise<Task[]> {
  const response = await fetch(`${API_URL}/campaign/${campaignId}/tasks`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch campaign tasks');
  }
  
  return response.json();
}

export async function updateTaskStatus(campaignId: string, taskId: string, status: string): Promise<void> {
  const response = await fetch(`${API_URL}/campaign/${campaignId}/task/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update task status');
  }
}

export async function updateCampaignMetrics(campaignId: string, metrics: CampaignMetrics): Promise<void> {
  const response = await fetch(`${API_URL}/campaign/${campaignId}/metrics`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ metrics }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update campaign metrics');
  }
}

export async function getCampaignMessages(campaignId: string) {
  const response = await fetch(`${API_URL}/campaign/${campaignId}/messages`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch campaign messages');
  }
  
  return response.json();
}
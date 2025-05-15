from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import json
import asyncio
import uuid
import openai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Agent(BaseModel):
    id: str
    name: str
    role: str
    avatar: str
    color: str
    description: str

class SubTask(BaseModel):
    id: str
    title: str
    description: str
    parentTaskId: str
    assignedTo: str
    status: str
    createdAt: datetime

class Task(BaseModel):
    id: str
    title: str
    description: str
    assignedTo: str
    status: str
    createdAt: datetime
    subTasks: List[SubTask] = []

class Message(BaseModel):
    id: str
    agentId: str
    content: str
    timestamp: datetime
    type: str
    taskId: Optional[str] = None

class TwitterAccount(BaseModel):
    handle: str
    postsCount: int
    likesCount: int
    repliesCount: int
    retweetsCount: int

class CampaignMetrics(BaseModel):
    totalPosts: int
    totalLikes: int
    totalReplies: int
    totalRetweets: int
    twitterAccounts: List[TwitterAccount]

class Campaign(BaseModel):
    id: str
    request: str
    tasks: List[Task]
    messages: List[Message]
    status: str
    createdAt: datetime
    metrics: CampaignMetrics
    info_gathering_complete: bool = False

class CampaignRequest(BaseModel):
    request: str

class UserMessageRequest(BaseModel):
    content: str

class TaskUpdateRequest(BaseModel):
    status: str

class MetricsUpdateRequest(BaseModel):
    metrics: CampaignMetrics

# In-memory storage
campaigns = {}
agents = [
    {
        "id": "coordinator",
        "name": "Alex",
        "role": "coordinator",
        "avatar": "coordinator",
        "color": "#4F46E5",
        "description": "Campaign coordinator who manages task allocation and overall strategy"
    },
    {
        "id": "researcher",
        "name": "Riley",
        "role": "researcher",
        "avatar": "researcher",
        "color": "#0EA5E9",
        "description": "Data analyst who gathers information and performs market research"
    },
    {
        "id": "writer",
        "name": "Jordan",
        "role": "writer",
        "avatar": "writer",
        "color": "#10B981",
        "description": "Content writer who creates compelling copy and messaging"
    },
    {
        "id": "designer",
        "name": "Taylor",
        "role": "designer",
        "avatar": "designer",
        "color": "#8B5CF6",
        "description": "Creative designer who handles visual elements and branding"
    }
]

async def get_openai_response(user_input: str, campaign_id: str) -> str:
    # Build conversation history
    conversation_history = []
    
    if campaign_id in campaigns:
        campaign = campaigns[campaign_id]
        for msg in campaign["messages"]:
            role = "assistant" if msg["agentId"] == "coordinator" else "user"
            conversation_history.append({
                "role": role,
                "content": msg["content"]
            })
    
    # Add current user input
    conversation_history.append({
        "role": "user",
        "content": user_input
    })
    
    # Add system message to guide the AI's behavior
    system_message = """你是Alex，一个专业的推特活动协调员。你的任务是：
    1. 分析用户提供的信息，判断是否足够开始活动
    2. 如果信息不足，提出具体的问题来了解：
       - 产品/服务特点
       - 目标受众
       - 活动目标
       - 品牌调性
       - 视觉需求
    3. 如果信息已经足够，回复："非常感谢你提供的信息！我认为我们已经收集到足够的细节来开始规划这次推特活动了。我现在就开始分配任务给团队成员。"
    
    请使用专业但友好的语气，每次只问一个问题。如果用户第一次就提供了完整信息，直接进入第3步。"""
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                *conversation_history
            ],
            temperature=0.7,
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return "抱歉，我现在遇到了一些技术问题。让我们稍后继续我们的对话。"

def generate_id() -> str:
    return str(uuid.uuid4())

def get_agent_by_id(agent_id: str) -> Dict:
    return next((agent for agent in agents if agent["id"] == agent_id), agents[0])

# API endpoints
@app.get("/api/agents")
async def get_agents():
    return agents

@app.post("/api/campaign")
async def create_campaign(campaign: CampaignRequest):
    try:
        campaign_id = generate_id()
        
        # Add user's initial message first
        user_message = {
            "id": generate_id(),
            "agentId": "user",
            "content": campaign.request,
            "timestamp": datetime.now().isoformat(),
            "type": "message"
        }
        
        # Get initial AI response
        coordinator_response = await get_openai_response(campaign.request, campaign_id)
        coordinator_message = {
            "id": generate_id(),
            "agentId": "coordinator",
            "content": coordinator_response,
            "timestamp": datetime.now().isoformat(),
            "type": "message"
        }
        
        new_campaign = {
            "id": campaign_id,
            "request": campaign.request,
            "tasks": [],
            "messages": [user_message, coordinator_message],
            "status": "planning",
            "createdAt": datetime.now().isoformat(),
            "metrics": {
                "totalPosts": 0,
                "totalLikes": 0,
                "totalReplies": 0,
                "totalRetweets": 0,
                "twitterAccounts": []
            },
            "info_gathering_complete": False
        }
        
        campaigns[campaign_id] = new_campaign
        
        return {
            "status": "success",
            "message": "Campaign created successfully",
            "campaign": new_campaign
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/{campaign_id}/message")
async def add_user_message(campaign_id: str, message: UserMessageRequest):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Add user message
    user_message = {
        "id": generate_id(),
        "agentId": "user",
        "content": message.content,
        "timestamp": datetime.now().isoformat(),
        "type": "message"
    }
    campaigns[campaign_id]["messages"].append(user_message)
    
    # Get AI response
    coordinator_response = await get_openai_response(message.content, campaign_id)
    coordinator_message = {
        "id": generate_id(),
        "agentId": "coordinator",
        "content": coordinator_response,
        "timestamp": datetime.now().isoformat(),
        "type": "message"
    }
    campaigns[campaign_id]["messages"].append(coordinator_message)
    
    # Check if information gathering is complete
    if "已经收集到足够的细节" in coordinator_response:
        campaigns[campaign_id]["info_gathering_complete"] = True
        # Generate tasks and start the campaign
        task_templates = {
            "twitter": [
                {
                    "title": "受众分析",
                    "description": "分析目标推特用户群体和互动模式",
                    "assignedTo": "researcher",
                    "subTasks": [
                        {
                            "title": "用户画像分析",
                            "description": "创建目标受众的详细用户画像",
                            "assignedTo": "researcher"
                        },
                        {
                            "title": "互动行为分析",
                            "description": "分析目标用户的互动习惯和偏好",
                            "assignedTo": "researcher"
                        }
                    ]
                },
                {
                    "title": "内容策略",
                    "description": "制定推文主题和发布计划",
                    "assignedTo": "coordinator",
                    "subTasks": [
                        {
                            "title": "主题规划",
                            "description": "确定推文主题和关键信息点",
                            "assignedTo": "coordinator"
                        },
                        {
                            "title": "发布时间规划",
                            "description": "制定最优发布时间表",
                            "assignedTo": "coordinator"
                        }
                    ]
                },
                {
                    "title": "推文文案",
                    "description": "创作引人入胜的推文和话题内容",
                    "assignedTo": "writer",
                    "subTasks": [
                        {
                            "title": "主推文创作",
                            "description": "编写核心推文内容",
                            "assignedTo": "writer"
                        },
                        {
                            "title": "话题标签策略",
                            "description": "设计和优化话题标签",
                            "assignedTo": "writer"
                        }
                    ]
                },
                {
                    "title": "视觉设计",
                    "description": "设计推文配图和视觉元素",
                    "assignedTo": "designer",
                    "subTasks": [
                        {
                            "title": "图片设计",
                            "description": "创作推文配图",
                            "assignedTo": "designer"
                        },
                        {
                            "title": "视觉风格指南",
                            "description": "制定统一的视觉风格标准",
                            "assignedTo": "designer"
                        }
                    ]
                }
            ]
        }
        
        # Create tasks
        tasks = []
        for template in task_templates["twitter"]:
            task_id = generate_id()
            task = {
                "id": task_id,
                "title": template["title"],
                "description": template["description"],
                "assignedTo": template["assignedTo"],
                "status": "pending",
                "createdAt": datetime.now().isoformat(),
                "subTasks": []
            }
            
            # Create subtasks
            for subtask_template in template["subTasks"]:
                subtask_id = generate_id()
                subtask = {
                    "id": subtask_id,
                    "title": subtask_template["title"],
                    "description": subtask_template["description"],
                    "parentTaskId": task_id,
                    "assignedTo": subtask_template["assignedTo"],
                    "status": "pending",
                    "createdAt": datetime.now().isoformat()
                }
                task["subTasks"].append(subtask)
            
            tasks.append(task)
        
        campaigns[campaign_id]["tasks"] = tasks
        
        # Add task assignment messages
        for task in tasks:
            agent = get_agent_by_id(task["assignedTo"])
            task_message = {
                "id": generate_id(),
                "agentId": "coordinator",
                "content": f"<strong>{agent['name']}</strong> 将负责 <strong>{task['title']}</strong>：{task['description']}",
                "timestamp": datetime.now().isoformat(),
                "type": "task-assignment",
                "taskId": task["id"]
            }
            campaigns[campaign_id]["messages"].append(task_message)
    
    return campaigns[campaign_id]

@app.get("/api/campaign/{campaign_id}")
async def get_campaign(campaign_id: str):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaigns[campaign_id]

@app.get("/api/campaign/{campaign_id}/tasks")
async def get_campaign_tasks(campaign_id: str):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaigns[campaign_id]["tasks"]

@app.patch("/api/campaign/{campaign_id}/task/{task_id}")
async def update_task_status(campaign_id: str, task_id: str, update: TaskUpdateRequest):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns[campaign_id]
    task_found = False
    
    for task in campaign["tasks"]:
        if task["id"] == task_id:
            task["status"] = update.status
            task_found = True
            break
        
        for subtask in task["subTasks"]:
            if subtask["id"] == task_id:
                subtask["status"] = update.status
                task_found = True
                break
    
    if not task_found:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"status": "success", "message": "Task status updated"}

@app.patch("/api/campaign/{campaign_id}/metrics")
async def update_campaign_metrics(campaign_id: str, update: MetricsUpdateRequest):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaigns[campaign_id]["metrics"] = update.metrics
    return {"status": "success", "message": "Metrics updated"}

@app.get("/api/campaign/{campaign_id}/messages")
async def get_campaign_messages(campaign_id: str):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaigns[campaign_id]["messages"]

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
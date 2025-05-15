from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import json
import asyncio
import uuid

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

class CampaignRequest(BaseModel):
    request: str

class TaskUpdateRequest(BaseModel):
    status: str

class MetricsUpdateRequest(BaseModel):
    metrics: CampaignMetrics

# In-memory storage (simulating a database)
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

# TODO dynamic generate tasks
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
# # TODO add random delay 1000-2000 ms or call API to generate message
# TODO self intro should Have a demonstration about adding multiple roles to the chat room
conversation_scripts = {
    "twitter": [
        {
            "agentId": "coordinator",
            "messageTemplate": "团队，我们收到了一个新的推特活动请求：'{request}'。让我们开始规划并准备好我们的推特助手。",
            "delay": 1033
        },
        {
            "agentId": "researcher",
            "messageTemplate": "我来分析目标受众的推特行为和互动模式。",
            "delay": 2192
        },
        {
            "agentId": "coordinator",
            "messageTemplate": "很好。我们需要制作能引起推特用户共鸣的内容和视觉效果。",
            "delay": 2320
        },
        {
            "agentId": "writer",
            "messageTemplate": "我会创作能提高互动率的推文，同时保持品牌调性。",
            "delay": 1325
        },
        {
            "agentId": "designer",
            "messageTemplate": "我来负责制作适合推特平台的吸引眼球的视觉内容。",
            "delay": 1782
        },
        {
            "agentId": "coordinator",
            "messageTemplate": "完美。我会协调推特助手执行计划。以下是任务分配：",
            "delay": 1209
        }
    ]
}

# Helper functions
def generate_id() -> str:
    return str(uuid.uuid4())

def get_agent_by_id(agent_id: str) -> Dict:
    return next((agent for agent in agents if agent["id"] == agent_id), agents[0])

def get_task_completion_detail(task: Dict) -> str:
    details = {
        "受众分析": "数据显示目标群体有很强的互动潜力。",
        "内容策略": "推文计划和内容主题已优化以获得最大覆盖。",
        "推文文案": "引人入胜的推文已准备好在我们的推特网络中发布。",
        "视觉设计": "吸引眼球的视觉内容已准备就绪，将提升推文互动率。"
    }
    return details.get(task["title"], "任务已成功完成。")

# API endpoints
@app.get("/api/agents")
async def get_agents():
    return agents

@app.post("/api/campaign")
async def create_campaign(campaign: CampaignRequest):
    try:
        campaign_id = generate_id()
        
        # Create initial tasks with subtasks
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

        # Create initial messages
        messages = []
        for script in conversation_scripts["twitter"]:
            message_id = generate_id()
            messages.append({
                "id": message_id,
                "agentId": script["agentId"],
                "content": script["messageTemplate"].replace("{request}", campaign.request),
                "timestamp": datetime.now().isoformat(),
                "type": "message"
            })

        # Add task assignment messages
        for task in tasks:
            message_id = generate_id()
            agent = get_agent_by_id(task["assignedTo"])
            messages.append({
                "id": message_id,
                "agentId": "coordinator",
                "content": f"<strong>{agent['name']}</strong> 将负责 <strong>{task['title']}</strong>：{task['description']}",
                "timestamp": datetime.now().isoformat(),
                "type": "task-assignment",
                "taskId": task["id"]
            })

        new_campaign = {
            "id": campaign_id,
            "request": campaign.request,
            "tasks": tasks,
            "messages": messages,
            "status": "planning",
            "createdAt": datetime.now().isoformat(),
            "metrics": {
                "totalPosts": 0,
                "totalLikes": 0,
                "totalReplies": 0,
                "totalRetweets": 0,
                "twitterAccounts": []
            }
        }
        
        # Store campaign in memory
        campaigns[campaign_id] = new_campaign

        return {
            "status": "success",
            "message": "Campaign created successfully",
            "campaign": new_campaign
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
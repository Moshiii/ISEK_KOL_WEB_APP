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
import random

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
        "id": "user",
        "name": "用户",
        "role": "user",
        "avatar": "user",
        "color": "#F43F5E",
        "description": "User of the system"
    },
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

THINKING_MESSAGES = [
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
    1. 根据用户的第一次输入, 生成一个推特活动的完整的宏观计划, 涵盖：
        - 产品名称： 产品/服务名称
        - 目标受众： 年龄段/职业/性别/爱好/需求
        - 活动目标： 点赞/转发/评论/曝光/粉丝
        - 品牌调性： 友好/幽默/专业/严肃
        - 视觉需求： 颜色/风格/元素
        每次生成结束之后，询问用户是否满意。
        
    2. 与客户确认是否满意，如果不满意，继续询问更多细节。
    3. 如果客户已经满意，总结为一个方案, 并且回复："非常感谢你提供的信息！我认为我们已经收集到足够的细节来开始规划这次推特活动了。我现在就开始分配任务给团队成员。"
    
    请使用专业但友好的语气，先给方案，少问问题。如果用户第一次就提供了完整信息，直接进入第3步。"""
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                *conversation_history
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return "抱歉，我现在遇到了一些技术问题。让我们稍后继续我们的对话。"

async def add_thinking_message(campaign: Dict) -> None:
    thinking_message = {
        "id": generate_id(),
        "agentId": "coordinator",
        "content": random.choice(THINKING_MESSAGES),
        "timestamp": datetime.now().isoformat(),
        "type": "message"
    }
    campaign["messages"].append(thinking_message)
    await asyncio.sleep(1.5)  # Add a delay to make it feel more natural

async def generate_tasks(campaign_request: str) -> List[Dict]:
    system_message = """你是一个推特活动策划专家。请根据用户的活动需求，生成一个详细的任务列表。每个任务都应该包含：
    - title: 任务标题
    - description: 任务描述
    - assignedTo: 负责人角色 (researcher/writer/designer/coordinator)
    - subTasks: 子任务列表，每个子任务包含相同的字段

    以JSON格式返回任务列表。确保任务分配合理，覆盖活动所需的所有方面。"""

    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": campaign_request}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        tasks_json = response.choices[0].message.content
        tasks_list = json.loads(tasks_json)
        
        # Add IDs and timestamps to tasks and subtasks
        for task in tasks_list:
            task["id"] = generate_id()
            task["status"] = "pending"
            task["createdAt"] = datetime.now().isoformat()
            
            if "subTasks" in task:
                for subtask in task["subTasks"]:
                    subtask["id"] = generate_id()
                    subtask["parentTaskId"] = task["id"]
                    subtask["status"] = "pending"
                    subtask["createdAt"] = datetime.now().isoformat()
        
        return tasks_list
    except Exception as e:
        print(f"OpenAI API error in generate_tasks: {e}")
        return []

def generate_id() -> str:
    return str(uuid.uuid4())

def get_agent_by_id(agent_id: str) -> Dict:
    return next((agent for agent in agents if agent["id"] == agent_id), agents[0])

def create_recruitment_messages() -> List[Dict]:
    messages = []
    
    # Alex's introduction message
    messages.append({
        "id": generate_id(),
        "agentId": "coordinator",
        "content": "根据您的需求，我已经组建了一个专业的团队来执行这次推特活动。让我来介绍一下团队成员：",
        "timestamp": datetime.now().isoformat(),
        "type": "message"
    })
    
    # Team member introductions
    team_intros = {
        "researcher": "大家好，我是Riley，作为研究分析师，我将负责深入分析目标受众、市场趋势和竞争对手，确保我们的活动策略建立在可靠的数据基础之上。",
        "writer": "你好，我是Jordan，我是团队的内容创作者。我会确保每条推文都富有吸引力，准确传达品牌信息，并与目标受众产生共鸣。",
        "designer": "嗨，我是Taylor，作为设计师，我将为活动创作视觉内容，确保每个设计元素都能强化品牌形象，提升用户参与度。"
    }
    
    for agent in agents[1:]:  # Skip the first agent (user)
        if agent["role"] in team_intros:
            messages.append({
                "id": generate_id(),
                "agentId": agent["id"],
                "content": team_intros[agent["role"]],
                "timestamp": datetime.now().isoformat(),
                "type": "message"
            })
    
    # Alex's closing message
    messages.append({
        "id": generate_id(),
        "agentId": "coordinator",
        "content": "现在我们的团队已经准备就绪，让我们开始规划这次推特活动吧！",
        "timestamp": datetime.now().isoformat(),
        "type": "message"
    })
    
    return messages

# API endpoints
@app.get("/api/agents")
async def get_agents():
    return agents

@app.post("/api/campaign")
async def create_campaign(campaign: CampaignRequest):
    try:
        campaign_id = generate_id()
        
        # Add user's initial message
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
    
    campaign = campaigns[campaign_id]
    
    # Add user message
    user_message = {
        "id": generate_id(),
        "agentId": "user",
        "content": message.content,
        "timestamp": datetime.now().isoformat(),
        "type": "message"
    }
    campaign["messages"].append(user_message)
    
    # Get AI response
    coordinator_response = await get_openai_response(message.content, campaign_id)
    coordinator_message = {
        "id": generate_id(),
        "agentId": "coordinator",
        "content": coordinator_response,
        "timestamp": datetime.now().isoformat(),
        "type": "message"
    }
    campaign["messages"].append(coordinator_message)
    
    # Check if information gathering is complete
    if "已经收集到足够的细节" in coordinator_response:
        campaign["info_gathering_complete"] = True
        
        # Add recruitment messages
        recruitment_messages = create_recruitment_messages()
        campaign["messages"].extend(recruitment_messages)
        
        # Add a thinking message before generating tasks
        await add_thinking_message(campaign)
        
        # Generate tasks using OpenAI
        tasks = await generate_tasks(campaign["request"])
        campaign["tasks"] = tasks
        
        # Add another thinking message
        await add_thinking_message(campaign)
        
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
            campaign["messages"].append(task_message)
            # Add a small delay between task assignments
            await asyncio.sleep(0.5)
    
    return campaign

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
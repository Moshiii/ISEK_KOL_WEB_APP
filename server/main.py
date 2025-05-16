from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import json
import asyncio
import uuid
import random

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
class CampaignRequest(BaseModel):
    request: str

class UserMessageRequest(BaseModel):
    content: str

class TaskExecutionRequest(BaseModel):
    taskId: str
    status: str

class TwitterAction(BaseModel):
    account: str
    action_type: str  # like, post, reply, retweet, follow
    target_account: Optional[str]
    post_id: Optional[str]
    content: Optional[str]

# In-memory storage
campaigns = {}

# Dummy data and templates
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

DUMMY_CAMPAIGN_PLAN = """基于您的需求，我为您制定了以下推广方案：

1. 目标受众：
   - 25-35岁的年轻专业人士
   - 对科技和创新感兴趣
   - 活跃在社交媒体平台

2. 活动目标：
   - 提升品牌知名度
   - 增加社交媒体互动
   - 扩大目标用户群

3. 执行策略：
   - 创建引人入胜的内容
   - 与行业KOL合作
   - 开展互动活动

您觉得这个方案怎么样？如果需要调整，请告诉我具体想法。"""

DUMMY_TEAM = [
    {
        "id": "researcher",
        "name": "Riley",
        "role": "researcher",
        "skills": ["数据分析", "市场研究", "竞品分析"],
        "introduction": "作为研究分析师，我将负责深入分析目标受众、市场趋势和竞争对手。"
    },
    {
        "id": "writer",
        "name": "Jordan",
        "role": "writer",
        "skills": ["内容创作", "文案策划", "社媒运营"],
        "introduction": "我是团队的内容创作者，将确保每条推文都能吸引目标受众。"
    },
    {
        "id": "designer",
        "name": "Taylor",
        "role": "designer",
        "skills": ["视觉设计", "品牌设计", "UI设计"],
        "introduction": "作为设计师，我将为活动创作视觉内容，提升品牌形象。"
    }
]

DUMMY_TASKS = [
    {
        "id": "task1",
        "title": "市场研究",
        "description": "分析目标受众和竞品情况",
        "assignedTo": "researcher",
        "status": "pending",
        "createdAt": datetime.now().isoformat(),
        "subTasks": []
    },
    {
        "id": "task2",
        "title": "内容策划",
        "description": "制定内容发布计划",
        "assignedTo": "writer",
        "status": "pending",
        "createdAt": datetime.now().isoformat(),
        "subTasks": []
    },
    {
        "id": "task3",
        "title": "视觉设计",
        "description": "设计活动主视觉",
        "assignedTo": "designer",
        "status": "pending",
        "createdAt": datetime.now().isoformat(),
        "subTasks": []
    }
]

TASK_RESULTS = {
    "researcher": {
        "in_progress": "正在进行市场调研，分析目标受众特征...",
        "completed": "市场调研完成！发现了几个很有价值的营销切入点。"
    },
    "writer": {
        "in_progress": "正在设计内容框架，编写推文...",
        "completed": "内容创作完成！我们有一个完整的推文发布计划了。"
    },
    "designer": {
        "in_progress": "正在设计视觉元素，确保品牌一致性...",
        "completed": "设计工作完成！所有视觉元素都准备就绪。"
    }
}

TWITTER_ACCOUNTS = [
    "tech_influencer",
    "digital_marketer",
    "social_guru",
    "content_creator"
]

DUMMY_POSTS = [
    "这个产品真的很棒！推荐大家试试 #创新",
    "使用体验超出预期，分享给大家 #推荐",
    "这款应用解决了我的很多问题 #好物推荐",
    "不得不说，这个真的很实用 #分享"
]

def generate_twitter_sequence():
    sequence = []
    accounts = TWITTER_ACCOUNTS.copy()
    random.shuffle(accounts)
    
    for i in range(10):
        action = random.choice(['post', 'like', 'reply', 'retweet', 'follow'])
        account = accounts[i % len(accounts)]
        target = random.choice([acc for acc in accounts if acc != account])
        post_id = f"post_{random.randint(1000, 9999)}" if action != 'follow' else None
        content = random.choice(DUMMY_POSTS) if action in ['post', 'reply'] else None
        
        sequence.append({
            "account": account,
            "action_type": action,
            "target_account": target if action in ['follow', 'reply'] else account,
            "post_id": post_id,
            "content": content
        })
    
    return sequence

def generate_id() -> str:
    return str(uuid.uuid4())

@app.post("/api/campaign")
async def create_campaign(campaign: CampaignRequest):
    campaign_id = generate_id()
    
    # Initialize campaign
    campaigns[campaign_id] = {
        "id": campaign_id,
        "request": campaign.request,
        "messages": [],
        "tasks": [],
        "status": "planning",
        "createdAt": datetime.now().isoformat(),
        "info_gathering_complete": False
    }
    
    # Add initial plan
    campaigns[campaign_id]["messages"].append({
        "id": generate_id(),
        "agentId": "coordinator",
        "content": DUMMY_CAMPAIGN_PLAN,
        "timestamp": datetime.now().isoformat(),
        "type": "message"
    })
    
    return {
        "status": "success",
        "campaign": campaigns[campaign_id]
    }

@app.post("/api/campaign/{campaign_id}/team")
async def get_team(campaign_id: str):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {"team": DUMMY_TEAM}

@app.post("/api/campaign/{campaign_id}/tasks")
async def get_tasks(campaign_id: str):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {"tasks": DUMMY_TASKS}

@app.post("/api/campaign/{campaign_id}/task/{task_id}/execute")
async def execute_task(campaign_id: str, task_id: str, execution: TaskExecutionRequest):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    task = next((t for t in DUMMY_TASKS if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    agent_role = task["assignedTo"]
    result = TASK_RESULTS[agent_role][execution.status]
    
    return {
        "status": "success",
        "result": result,
        "taskStatus": execution.status
    }

@app.get("/api/campaign/{campaign_id}")
async def get_campaign(campaign_id: str):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaigns[campaign_id]

@app.post("/api/campaign/{campaign_id}/twitter-sequence")
async def get_twitter_sequence(campaign_id: str):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    sequence = generate_twitter_sequence()
    
    return {
        "status": "success",
        "sequence": sequence
    }

@app.post("/api/campaign/{campaign_id}/confirm")
async def confirm_campaign(campaign_id: str):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaigns[campaign_id]["status"] = "in_progress"
    campaigns[campaign_id]["info_gathering_complete"] = True
    
    return {
        "status": "success",
        "message": "Campaign confirmed and started"
    }
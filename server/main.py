from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import json
import asyncio
import uuid
import random
import time
import openai
from dotenv import load_dotenv
import os

load_dotenv()
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
class CampaignRequest(BaseModel):
    request: str

class UserMessageRequest(BaseModel):
    content: str

class TaskExecutionRequest(BaseModel):
    status: str

class TeamRequest(BaseModel):
    campaignPlan: str

class TaskRequest(BaseModel):
    campaignPlan: str
    teamPlan: List[Dict]

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
    "Let me think about the best execution plan...",
    "Analyzing market trends and target audience...",
    "Evaluating the feasibility of different strategies...",
    "Designing the task allocation scheme...",
    "Developing a detailed execution plan...",
    "Considering various possible marketing angles...",
    "Planning the timeline and milestones...",
    "Assessing resource allocation options...",
    "Thinking about how to maximize campaign effectiveness...",
    "Formulating specific implementation steps..."
]

DUMMY_CAMPAIGN_PLAN = """Based on your requirements, I have developed the following marketing plan:

1. Target Audience:
    - Young professionals aged 25-35
    - Interested in technology and innovation
    - Active on social media platforms

2. Campaign Goals:
    - Increase brand awareness
    - Boost social media engagement
    - Expand the target user base

3. Execution Strategies:
    - Create engaging content
    - Collaborate with industry KOLs
    - Launch interactive activities

What do you think of this plan? If you need any adjustments, please let me know your specific ideas."""

DUMMY_TEAM = [
    {
        "id": "researcher",
        "name": "Riley",
        "role": "researcher",
        "skills": ["Data Analysis", "Market Research", "Competitor Analysis"],
        "introduction": "As a research analyst, I will be responsible for in-depth analysis of the target audience, market trends, and competitors."
    },
    {
        "id": "writer",
        "name": "Jordan",
        "role": "writer",
        "skills": ["Content Creation", "Copywriting", "Social Media Operations"],
        "introduction": "I am the team's content creator and will ensure every post attracts the target audience."
    },
    {
        "id": "designer",
        "name": "Taylor",
        "role": "designer",
        "skills": ["Visual Design", "Brand Design", "UI Design"],
        "introduction": "As the designer, I will create visual content for the campaign to enhance the brand image."
    }
]

DUMMY_TASKS = [
    {
        "id": "task1",
        "title": "Market Research",
        "description": "Analyze target audience and competitors",
        "assignedTo": "researcher",
        "status": "pending",
        "createdAt": datetime.now().isoformat(),
        "subTasks": []
    },
    {
        "id": "task2",
        "title": "Content Planning",
        "description": "Develop content publishing plan",
        "assignedTo": "writer",
        "status": "pending",
        "createdAt": datetime.now().isoformat(),
        "subTasks": []
    },
    {
        "id": "task3",
        "title": "Visual Design",
        "description": "Design main visual for the campaign",
        "assignedTo": "designer",
        "status": "pending",
        "createdAt": datetime.now().isoformat(),
        "subTasks": []
    }
]

TASK_RESULTS = {
    "researcher": {
        "in_progress": "Conducting market research and analyzing target audience characteristics...",
        "completed": "Market research completed! I found several valuable marketing insights:\n1. Target users are mainly active during morning and evening peak hours\n2. They respond most positively to interactive content\n3. Technology topics are the most popular"
    },
    "writer": {
        "in_progress": "Designing content framework and drafting tweets...",
        "completed": "Content creation completed! We have prepared a series of engaging tweets, including:\n1. Product feature showcases\n2. User case studies\n3. Industry trend analysis"
    },
    "designer": {
        "in_progress": "Designing visual elements to ensure brand consistency...",
        "completed": "Design work completed! Created a complete set of visual assets:\n1. Main brand visuals\n2. Social media templates\n3. Interactive content graphics"
    }
}

async def stream_thinking_messages():
    for message in THINKING_MESSAGES:
        yield json.dumps({"type": "thinking", "content": message}) + "\n"
        await asyncio.sleep(random.uniform(0.5, 1.5))

async def stream_campaign_plan():
    # Simulate streaming the campaign plan word by word
    words = DUMMY_CAMPAIGN_PLAN.split()
    current_sentence = []
    
    for word in words:
        current_sentence.append(word)
        if word.endswith(('.', ':', '?', '!')):
            yield json.dumps({
                "type": "content",
                "content": ' '.join(current_sentence)
            }) + "\n"
            current_sentence = []
            await asyncio.sleep(0.1)
    
    if current_sentence:
        yield json.dumps({
            "type": "content",
            "content": ' '.join(current_sentence)
        }) + "\n"

async def stream_team_introductions():
    for member in DUMMY_TEAM:
        yield json.dumps({
            "type": "team_member",
            "content": member
        }) + "\n"
        await asyncio.sleep(1)

async def stream_task_assignments():
    for task in DUMMY_TASKS:
        yield json.dumps({
            "type": "task",
            "content": task
        }) + "\n"
        await asyncio.sleep(1)

@app.post("/api/campaign")
async def create_campaign(campaign: CampaignRequest):
    campaign_id = str(uuid.uuid4())
    campaigns[campaign_id] = {
        "id": campaign_id,
        "request": campaign.request,
        "messages": [],
        "tasks": [],
        "status": "planning",
        "createdAt": datetime.now().isoformat(),
        "info_gathering_complete": False
    }

    async def generate():
        # Stream thinking messages
        async for message in stream_thinking_messages():
            yield message

        # Stream campaign plan
        async for content in stream_campaign_plan():
            yield content

        # Send final campaign data
        yield json.dumps({
            "type": "complete",
            "content": {
                "status": "success",
                "campaign": campaigns[campaign_id]
            }
        })

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/api/campaign/{campaign_id}/team")
async def get_team(campaign_id: str, request: TeamRequest):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaigns[campaign_id]["campaign_plan"] = request.campaignPlan

    async def generate():
        async for member in stream_team_introductions():
            yield member
        
        yield json.dumps({
            "type": "complete",
            "content": {"team": DUMMY_TEAM}
        })

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/api/campaign/{campaign_id}/tasks")
async def get_tasks(campaign_id: str, request: TaskRequest):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    async def generate():
        async for task in stream_task_assignments():
            yield task
        
        yield json.dumps({
            "type": "complete",
            "content": {"tasks": DUMMY_TASKS}
        })

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/api/campaign/{campaign_id}/task/{task_id}/execute")
async def execute_task(campaign_id: str, task_id: str, execution: TaskExecutionRequest):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    task = next((t for t in DUMMY_TASKS if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    agent_role = task["assignedTo"]
    result = TASK_RESULTS[agent_role][execution.status]

    async def generate():
        # Stream thinking messages first
        async for message in stream_thinking_messages():
            yield message

        # Stream the actual result
        words = result.split()
        current_sentence = []
        
        for word in words:
            current_sentence.append(word)
            if word.endswith(('.', ':', '?', '!')):
                yield json.dumps({
                    "type": "content",
                    "content": ' '.join(current_sentence)
                }) + "\n"
                current_sentence = []
                await asyncio.sleep(0.1)
        
        if current_sentence:
            yield json.dumps({
                "type": "content",
                "content": ' '.join(current_sentence)
            }) + "\n"

        # Send completion status
        yield json.dumps({
            "type": "complete",
            "content": {
                "status": "success",
                "result": result,
                "taskStatus": execution.status
            }
        })

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/api/campaign/{campaign_id}")
async def get_campaign(campaign_id: str):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaigns[campaign_id]

@app.post("/api/campaign/{campaign_id}/twitter-sequence")
async def get_twitter_sequence(campaign_id: str):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    sequence = [
        {
            'account': 'social_guru',
            'action_type': 'post',
            'target_account': 'social_guru',
            'content': 'Excited to share this amazing product! #Innovation'
        },
        {
            'account': 'tech_influencer',
            'action_type': 'like',
            'target_account': 'social_guru',
            'post_id': 'post_1234'
        },
        {
            'account': 'digital_marketer',
            'action_type': 'retweet',
            'target_account': 'social_guru',
            'post_id': 'post_1234'
        }
    ]
    
    async def generate():
        for action in sequence:
            yield json.dumps({
                "type": "action",
                "content": action
            }) + "\n"
            await asyncio.sleep(0.5)
        
        yield json.dumps({
            "type": "complete",
            "content": {
                "status": "success",
                "sequence": sequence
            }
        })

    return StreamingResponse(generate(), media_type="text/event-stream")

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
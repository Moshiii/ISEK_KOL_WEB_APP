from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

#  use chat.completions.create
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

TWITTER_ACCOUNTS = [
    "tech_influencer",
    "digital_marketer",
    "social_guru",
    "content_creator"
]

DUMMY_POSTS = [
    "This product is really great! Highly recommend everyone to try it. #Innovation",
    "The user experience exceeded my expectations, sharing with everyone. #Recommended",
    "This app solved many of my problems. #ProductRecommendation",
    "I have to say, this is really practical. #Sharing"
]

DUMMY_SEQUENCE = [
    {
        'account': 'social_guru',
        'action_type': 'follow',
        'target_account': 'tech_influencer',
        'post_id': None,
        'content': None
    },
    {
        'account': 'digital_marketer',
        'action_type': 'like',
        'target_account': 'digital_marketer',
        'post_id': 'post_6728',
        'content': None
    },
    {
        'account': 'tech_influencer',
        'action_type': 'reply',
        'target_account': 'digital_marketer',
        'post_id': 'post_7469',
        'content': '这款应用解决了我的很多问题 #好物推荐'
    },
    {
        'account': 'content_creator',
        'action_type': 'like',
        'target_account': 'content_creator',
        'post_id': 'post_5035',
        'content': None
    },
    {
        'account': 'social_guru',
        'action_type': 'like',
        'target_account': 'social_guru',
        'post_id': 'post_7886',
        'content': None
    },
    {
        'account': 'digital_marketer',
        'action_type': 'like',
        'target_account': 'digital_marketer',
        'post_id': 'post_7961',
        'content': None
    },
    {
        'account': 'tech_influencer',
        'action_type': 'retweet',
        'target_account': 'tech_influencer',
        'post_id': 'post_4120',
        'content': None
    },
    {
        'account': 'content_creator',
        'action_type': 'follow',
        'target_account': 'digital_marketer',
        'post_id': None,
        'content': None
    },
    {
        'account': 'social_guru',
        'action_type': 'retweet',
        'target_account': 'social_guru',
        'post_id': 'post_1019',
        'content': None
    },
    {
        'account': 'digital_marketer',
        'action_type': 'post',
        'target_account': 'digital_marketer',
        'post_id': 'post_9713',
        'content': '这款应用解决了我的很多问题 #好物推荐'
    }
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

def llm_call(prompt: str) -> str:
    # use openai API to get the response
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )
    return response.choices[0].message.content

def generate_id() -> str:
    return str(uuid.uuid4())

def generate_campaign_plan(request: str) -> str:
    # Simulate a thinking process
    # TODO: later replace by openai API call
    time.sleep(3)
    prompt = f'''
    Based on the following requirements, please provide a detailed marketing plan:
    {request}
    Requirements:
    1. Target Audience
    2. Campaign Goals
    3. marketing Strategies
    4. Execution Plan
    7. Risk Assessment
    8. Result Assessment
    9. Team Roles and Responsibilities
    11. Budget and Cost Control
    
    for example:
    
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
        ...

    Please provide a detailed plan, including specific implementation steps and timelines.    
    '''
    # CAMPAIGN_PLAN = llm_call(prompt)
    return random.choice(THINKING_MESSAGES) + "\n\n" + DUMMY_CAMPAIGN_PLAN
    # return CAMPAIGN_PLAN

def generate_team(campaign_plan: str) -> List[Dict]:
    # TODO: later replace by openai API call
    time.sleep(1)
    return {"team": DUMMY_TEAM}

def generate_tasks(campaign_plan: str, team_plan: List[Dict]) -> List[Dict]:
    # TODO: later replace by openai API call
    time.sleep(1)
    return {"tasks": DUMMY_TASKS}

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
        "content": generate_campaign_plan(campaign.request),
        # "content": DUMMY_CAMPAIGN_PLAN,
        "timestamp": datetime.now().isoformat(),
        "type": "message"
    })
    time.sleep(3)
    return {
        "status": "success",
        "campaign": campaigns[campaign_id]
    }

@app.post("/api/campaign/{campaign_id}/team")
async def get_team(campaign_id: str, request: TeamRequest):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Store the campaign plan for later use
    campaigns[campaign_id]["campaign_plan"] = request.campaignPlan
    return generate_team(request.campaignPlan)
    return {"team": DUMMY_TEAM}

@app.post("/api/campaign/{campaign_id}/tasks")
async def get_tasks(campaign_id: str, request: TaskRequest):
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return generate_tasks(request.campaignPlan, request.teamPlan)
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
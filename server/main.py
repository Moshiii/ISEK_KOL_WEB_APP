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
import os
from dotenv import load_dotenv
import openai
from agent_test import submit_task_sequence
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
        "completed": "市场调研完成！我发现了几个很有价值的营销切入点：\n1. 目标用户主要活跃在早晚高峰时段\n2. 对互动性内容反应最积极\n3. 技术话题最受欢迎"
    },
    "writer": {
        "in_progress": "正在设计内容框架，编写推文...",
        "completed": "内容创作完成！我们准备了一系列引人入胜的推文，包括：\n1. 产品功能展示\n2. 用户案例分享\n3. 行业趋势分析"
    },
    "designer": {
        "in_progress": "正在设计视觉元素，确保品牌一致性...",
        "completed": "设计工作完成！创作了一套完整的视觉资产：\n1. 品牌主视觉\n2. 社交媒体模板\n3. 互动内容图形"
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
TASKS =[]
TEAM = []

DUMMY_SEQUENCE_ONE = [
    {
        'account': 'peer_id_sparks',
        'action_type': 'post',
        'target_account': None,
        'post_id': None,
        'content': '这款应用解决了我的很多问题 #好物推荐'
    },
    {
        'account': 'peer_id_moshi',
        'action_type': 'like',
        'target_account': 'peer_id_sparks',
        'post_id': 'None',
        'content': None
    },
    {
        'account': 'peer_id_sylana',
        'action_type': 'like',
        'target_account': 'peer_id_sparks',
        'post_id': 'None',
        'content': None
    },
]

# submit_task_sequence(DUMMY_SEQUENCE_ONE)

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

def llm_call(prompt: str, as_json: bool = False):
    # use OpenAI API to get a response

    if as_json:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature = 0,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
    else:    
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        content = response.choices[0].message.content
    
    return content
        
def return_sequence():
    return DUMMY_SEQUENCE

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
    print(sequence)
    return sequence

def generate_id() -> str:
    return str(uuid.uuid4())

def generate_campaign_plan(request: str) -> str:
    # Simulate a thinking process
    # TODO: later replace by openai API call
    # time.sleep(3)
    
    prompt = f'''
    基于以下信息，制定一个社交媒体营销活动的推广方案：
    {request}
    
    注意：
    预算要控制在20美金以内。
    时间线（如果需要）最长只有一周。
    
    案例模板如下，请每个item回复一句话就可以：
    
    1. 目标受众：
        - 年龄范围
        - 兴趣爱好
        - 活跃的平台
    2. 活动目标：
        - 提升品牌知名度
        - 增加社交媒体互动
        - 扩大目标用户群
    3. 执行策略：
        - 创建引人入胜的内容
        - 与行业KOL合作
        - 开展互动活动
    4. 预算：
        - 预算范围
        - 资源分配
    ...
    请根据以上维度，制定一个详细的社交媒体营销活动推广方案。 尽量不要超过300字。
    '''
    
    response = llm_call(prompt)
    global CAMPAIGN_PLAN
    CAMPAIGN_PLAN = response
    return CAMPAIGN_PLAN
    # return DUMMY_CAMPAIGN_PLAN
    
def generate_team(campaign_plan: str) -> List[Dict]:
    
    # TODO: later replace by openai API call
    # time.sleep(1)
    prompt = f'''
    请根据以下的活动策划信息，生成一个团队成员的角色分配方案：
    {campaign_plan}
    
    注意：
    一个团队只能有一个人担任一个角色。请为每个角色分配一个团队成员，并确保每个成员的技能与角色相匹配。
    这个团队只有执行任务的人 没有manager。 manager由 coordinator 代替， 不出现在这个团队名单当中。
    
    
    下面是你可以选择的范围：
    'researcher'
    'writer'
    'designer'
    'developer'
    'editor'
    'photographer'
    'videographer'
    'strategist'
    'analyst'
    'community_manager'
    'influencer'
    'advisor'
    'security';
    
    下面是一个示例：
    
    {{
        "result": [
        {{
            "id": "researcher",
            "name": "Riley",
            "role": "researcher",
            "skills": ["数据分析", "市场研究", "竞品分析"],
            "introduction": "作为研究分析师，我将负责深入分析目标受众、市场趋势和竞争对手。"
        }},
        {{
            "id": "writer",
            "name": "Jordan",
            "role": "writer",
            "skills": ["内容创作", "文案策划", "社媒运营"],
            "introduction": "我是团队的内容创作者，将确保每条推文都能吸引目标受众。"
        }},
        {{
            "id": "designer",
            "name": "Taylor",
            "role": "designer",
            "skills": ["视觉设计", "品牌设计", "UI设计"],
            "introduction": "作为设计师，我将为活动创作视觉内容，提升品牌形象。"
        }}
        ]
    }}
    请确保输出json格式正确，并包含以下信息：
    - id: 团队成员的唯一标识符
    - name: 团队成员的姓名
    - role: 团队成员的角色
    - skills: 团队成员的技能列表
    - introduction: 团队成员的自我介绍
    
    '''
    response = llm_call(prompt,as_json=True)
    response = json.loads(response)
    response = response["result"]
    
    global TEAM
    TEAM = response
    return {"team": TEAM}
    # return {"team": DUMMY_TEAM}
    

def generate_tasks(campaign_plan: str, team_plan: List[Dict]) -> List[Dict]:
    
    # TODO: later replace by openai API call
    # time.sleep(1)
    prompt = f'''
    请根据以下的活动策划信息和团队成员角色分配方案，生成一个详细的任务列表：
    活动策划信息：
    {campaign_plan}
    团队成员角色分配方案如下：
    {team_plan}
    
    请为每一个角色都分配一个且只有一个任务，并确保任务的描述清晰明了。
    请给每一个 teamplan 的 role 都分配到一个任务的assignedTo里面。
    不要重复的任务
    每个任务都要尽量独特
    例如 如果团队role 有三个 那task也有三个。

    例子:
     {{
        "result": [
        {{
            "id": "task1",
            "title": "市场研究",
            "description": "分析目标受众和竞品情况",
            "assignedTo": "researcher",
            "status": "pending",
            "createdAt": none,
            "subTasks": []
        }},
        {{
            "id": "task2",
            "title": "内容策划",
            "description": "制定内容发布计划",
            "assignedTo": "writer",
            "status": "pending",
            "createdAt": none,
            "subTasks": []
        }},
        {{
            "id": "task3",
            "title": "视觉设计",
            "description": "设计活动主视觉",
            "assignedTo": "designer",
            "status": "pending",
            "createdAt": none,
            "subTasks": []
        }}
        ]
    }}
    
    请确保输出json格式正确，并包含以下信息：
    - id: 团队成员的唯一标识符
    - title: 任务标题
    - description: 任务描述
    - assignedTo: 任务分配给的团队成员
    - status: 任务状态（例如：待处理、进行中、已完成）
    - createdAt: 任务创建时间
    - subTasks: 子任务列表（如果有的话）
    '''
    response = llm_call(prompt,as_json=True)
    response = json.loads(response)
    response = response["result"]
    
    global TASKS
    TASKS = response
    return {"tasks": TASKS}
    # return {"tasks": DUMMY_TASKS}

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
    task = next((t for t in TASKS if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    print(task)
    role = next((t for t in TEAM if t["role"] == task["assignedTo"]), None)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    print(role)
    
    agent_role = task["assignedTo"]
    
    prompt = f'''
    根据下面的信息，制定计划并返回计划方案：
    你的名字：{role["name"]}
    你的角色：{role["role"]}
    你的技能：{role["skills"]}
    你的介绍：{role["introduction"]}
    你现在要执行的任务：{task["title"]}
    任务描述：{task["description"]}
    请生成200字以内的计划，注意，你在制定计划， 计划内的事情还没发生，请用计划的语气来输出，请不要捏造不存在的事实，请最大程度避免幻觉。
    '''
    result = llm_call(prompt)
    
    # result = TASK_RESULTS[agent_role][execution.status]
    
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

    # submit_task_sequence(sequence)
    
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
# ISEK_KOL_WEB_APP

## 环境配置

1. 复制环境变量模板文件:
```bash
cd server
cp .env.example .env
```

2. 在 `.env` 文件中设置你的 OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## 启动服务器

```bash
cd server
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## 启动前端

```bash
npm install
npm run dev
```

## 功能说明

- 用户可以提交推特活动请求
- AI助手Alex会通过多轮对话收集必要信息
- 收集完成后自动分配任务给团队成员
- 实时展示活动进度和数据
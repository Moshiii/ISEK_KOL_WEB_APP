# ISEK_KOL_WEB_APP

## Environment Setup

1. Copy the environment variable template file:
```bash
cd server
cp .env.example .env
```

2. Set your OpenAI API key in the `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Start the Server

```bash
cd server
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Start the Frontend

```bash
npm install
npm run dev
```

## Features

- Users can submit Twitter campaign requests
- AI assistant Alex collects necessary information through multi-round dialogues
- Automatically assigns tasks to team members
- Real-time display of campaign progress and data
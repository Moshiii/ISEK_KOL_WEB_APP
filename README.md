# ISEK_KOL_WEB_APP


## start python server using:

cd server

python3 -m pip install -r requirements.txt

python3 -m uvicorn main:app --host 0.0.0.0 --port 8000


## start frontend using:

npm install

npm run dev

# TODO:

插件端：
1. 加一个API 在网页server端能调用 我向这个API发送一个大的json：

{
    user_ID: AAA
    action: 点赞
    postID: xxxxx
    content: postID
}
{
    user_ID: BBB
    action: 发推
    postID: None
    content: blahblah
}
{
    user_ID: CCC
    action: 回复
    postID: xxxxx
    content: blahblah
}

# 网页端:
1. 改后台 让生成内容略有不同 
2. 让生成的任务有结果。
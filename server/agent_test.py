import json
import time

from isek.agent.distributed_agent import DistributedAgent
from isek.agent.distributed_agent import DistributedAgent
from isek.node.etcd_registry import EtcdRegistry
from isek.node.isek_center_registry import IsekCenterRegistry
from isek.agent.persona import Persona
from isek.util.logger import LoggerManager, logger
from isek.llm import OpenAIModel

Mani_info = {
    "name": "Mani",
    "bio": "An experienced manager",
    "lore": "Your mission is to manage the team",
    "knowledge": "recruit, assign tasks, manage tasks, manage projects",
    "routine": "1. if receive a task, decompose the task to subtasks. 2. search for partners for each task. 3. send message to other agnet to do the tasks. user is your boss, do not ask user to do the task"
}

registry = IsekCenterRegistry()

model = OpenAIModel(
    model_name="ep-20241014143448-kgndv",
    api_key="8b524dd5-b556-4b7a-8d6d-f9aca772aa4a",
    base_url="https://ark.cn-beijing.volces.com/api/v3",
)

Mani = Persona.from_json(Mani_info)

Mani_agent = DistributedAgent(persona=Mani, host="localhost", port=8080, p2p_server_port=9000, registry=registry, model=model)
Mani_agent.tool_manager.register_tools([
    Mani_agent.search_partners,
    Mani_agent.send_message,
    Mani_agent.decompose_task,
])
Mani_agent.build(daemon=True)
time.sleep(5)

message = {
    "name": Mani_agent.persona.name,
    "query": "hello",
    "peerid": Mani_agent.peer_id
}
Mani_agent.send_p2p_message("/ip4/45.32.115.124/tcp/9090/ws/p2p/12D3KooWEm7y24CfhEUAvNcQH1osnwhHt3ibGYZdKdLpezQt1r4Y/p2p-circuit/p2p/12D3KooWFMCoVcaJUCyPN2o9c1C6ndEQeXoebFg15EcLXrxp2vw4", json.dumps(message, ensure_ascii=False))

import json
import time
import threading

from isek.agent.distributed_agent import DistributedAgent
from isek.agent.distributed_agent import DistributedAgent
from isek.node.etcd_registry import EtcdRegistry
from isek.node.isek_center_registry import IsekCenterRegistry
from isek.agent.persona import Persona
from isek.util.logger import LoggerManager, logger
from isek.llm import OpenAIModel
import peers

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
time.sleep(10)


def submit_task_sequence(task_sequence=None):
    server_thread = threading.Thread(target=submit_task_sequence_impl)
    server_thread.start()
    return True


def submit_task_sequence_impl():
    # task_sequence = [
    #     {
    #         "name": Mani_agent.persona.name,
    #         "query": "发一个推特，内容是“你好，ISEK",
    #         "peerid": "12D3KooWGAGqSgxn2Cxr8TAiYjMRoGqkz5jQMEbBiPyHtmBFf9HE"
    #     },
    #     {
    #         "name": Mani_agent.persona.name,
    #         "query": "发一个推特，内容是“你好，ISEK",
    #         "peerid": "12D3KooWC7b7sRhKAMV9sGjN7Ls8rzzop88wEAbFAoQ4pVemG3aQ"
    #     }
    # ]
    # for task in task_sequence:
    #     peer_id = task['peerid']
    #     Mani_agent.send_p2p_message(peers.get_by_peer_id(peer_id).addr, json.dumps(task, ensure_ascii=False))
    for peer_id, peer in peers.get_all_peers().items():
        
        
        # 'account': 'peer_id_moshi',
        # 'action_type': 'like',
        # 'target_account': 'peer_id_sparks',
        # 'post_id': 'None',
        # 'content': None
        task = {
            "name": Mani_agent.persona.name,
            "query": "发一个推特，内容是“你好，ISEK",
            "peerid": peer_id
        }
        Mani_agent.send_p2p_message(peer.addr, json.dumps(task, ensure_ascii=False))


# submit_task_sequence(None)
# peer_id = "12D3KooWJppwDcvBVJA5ruh6yC2th92d6RW4m6v51KLw62hSxxBQ"
# message = {
#     "name": Mani_agent.persona.name,
#     "query": "发一个推特，内容是“你好，ISEK",
#     "peerid": Mani_agent.peer_id
# }
# Mani_agent.send_p2p_message(peers.get_by_peer_id(peer_id).addr, json.dumps(message, ensure_ascii=False))



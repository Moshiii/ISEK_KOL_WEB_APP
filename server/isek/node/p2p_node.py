import json
import threading
import time
from abc import ABC, abstractmethod
from concurrent import futures
from typing import Dict
import atexit
import faiss
import subprocess
import grpc
import numpy as np

from server.isek.constant.exceptions import NodeUnavailableError
from server.isek.node.noderpc import node_pb2, node_pb2_grpc
from server.isek.node.registry import Registry
from server.isek.util.logger import logger
from server.isek.node.node_index import NodeIndex
from server.isek.embedding.abstract_embedding import AbstractEmbedding
from server.isek.node.isek_center_registry import IsekCenterRegistry
import os


class P2PNode(node_pb2_grpc.IsekP2PNodeServiceServicer, ABC):
    def __init__(self,
                 host: str = "localhost",
                 port: int = 8080,
                 p2p_server_port: int = 3000,
                 registry: Registry = IsekCenterRegistry(),
                 embedding: AbstractEmbedding = None,
                 **kwargs
                 ):
        if not host or not port:
            raise ValueError("Node")
        self.node_id = self.build_node_id()
        self.host = host
        self.port = port
        # self.registry = registry
        self.all_nodes = {}
        self.node_index = None
        self.p2p_server_port = p2p_server_port
        self.peer_id = None
        self.p2p_address = None
        self.p2p_server_stub = None
        if embedding:
            self.node_index = NodeIndex(embedding)
        self.node_list = None
        # self.__build_server()

    @abstractmethod
    def build_node_id(self) -> str:
        pass

    @abstractmethod
    def metadata(self) -> Dict:
        pass

    @abstractmethod
    def on_message(self, sender, message) -> str:
        pass

    def build_server(self):
        self.__bootstrap_p2p_server()
        # self.registry.register_node(node_id=self.node_id, host=self.host, port=self.port,
        #                             p2p_address=self.p2p_address, metadata=self.metadata())
        self.__bootstrap_heartbeat()
        self.__bootstrap_grpc_server()

    def __load_p2p_context(self):
        try:
            if not self.p2p_server_stub:
                channel = grpc.insecure_channel(f"localhost:{self.p2p_server_port}")
                self.p2p_server_stub = node_pb2_grpc.IsekP2PNodeServiceStub(channel)

            response = self.p2p_server_stub.p2p_context(node_pb2.P2PContextRequest())
            self.peer_id = response.peer_id
            self.p2p_address = response.p2p_address
            return response
        except:
            logger.exception("Load p2p server context error.")
            self.p2p_server_stub = None
            return None

    def __bootstrap_p2p_server(self):
        def stream_output(stream):
            for line in iter(stream.readline, ''):
                logger.debug(line)
        process = subprocess.Popen(
            ["node", "p2p-server/p2p_server.js", f"--port={self.p2p_server_port}", f"--agent_port={self.port}"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        def cleanup():
            if process and process.poll() is None:
                process.terminate()
            logger.debug(f"p2p_server[port:{self.p2p_server_port}] process terminated")
        atexit.register(cleanup)
        thread = threading.Thread(target=stream_output, args=(process.stdout,), daemon=True)
        thread.start()
        while True:
            p2p_context = self.__load_p2p_context()
            if p2p_context and p2p_context.peer_id and p2p_context.p2p_address:
                logger.debug(f"The p2p service has been completed: {p2p_context}")
                break
            time.sleep(1)

    def __bootstrap_heartbeat(self):
        self.__load_p2p_context()
        # self.registry.lease_refresh(self.node_id)
        self.__refresh_nodes()
        # logger.debug(f"{self.node_id} get all available nodes: {self.all_nodes}")
        timer = threading.Timer(5, self.__bootstrap_heartbeat)
        timer.daemon = True
        timer.start()

    def __refresh_nodes(self):
        # all_nodes = self.registry.get_available_nodes()
        all_nodes = {}
        # todo self.node_index.compare_and_build(all_nodes)
        # is_nodes_changed = False
        # for node_id, node_info in all_nodes.items():
        #     if node_id not in self.all_nodes:
        #         is_nodes_changed = True
        #         break
        # if is_nodes_changed or len(all_nodes) != len(self.all_nodes):
        #     node_ids, vectors = zip(*[(node_id, n['metadata']['intro_vector']) for node_id, n in all_nodes.items()])
        #     vector_dim = len(vectors[0])
        #     vectors = np.array(vectors, dtype='float32')
        #     self.node_index = faiss.IndexFlatL2(vector_dim)
        #     self.node_index.add(vectors)
        #     self.node_list = node_ids
        #     logger.debug("Node index rebuild finished.")
        self.all_nodes = all_nodes

    def __bootstrap_grpc_server(self):
        server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
        node_pb2_grpc.add_IsekP2PNodeServiceServicer_to_server(self, server)

        # 监听端口
        server.add_insecure_port(f'[::]:{self.port}')
        server.start()
        logger.info(f"[{self.node_id}] Node started on port {self.port}...")
        server.wait_for_termination()
        # def wait_for_termination():
        #
        #
        # termination_thread = threading.Thread(target=wait_for_termination)
        # termination_thread.start()

    def send_p2p_message(self, receiver_p2p_address, message):
        logger.info(f"[{self.node_id}] send msg to [{receiver_p2p_address}]: {message}")

        request = node_pb2.CallPeerRequest(sender_node_id=self.node_id,
                                           receiver_p2p_address=receiver_p2p_address, message=message)

        # receiver_p2p_address = "/ip4/127.0.0.1/tcp/50706/ws/p2p/12D3KooWF5mcsBaMKdJ9Rc1A2cp6KWSsaJUVxG2YkXJduJAkiQTK/p2p-circuit/p2p/12D3KooWKQgxkeJAa1wUTGVCi8X3KpLxL7za51srd8m46PirmVvS"
        # request = node_pb2.CallPeerRequest(sender_node_id=self.node_id, receiver_p2p_address=receiver_p2p_address, message=message)

        # 调用远程服务方法
        response = self.p2p_server_stub.call_peer(request)
        # log the response
        logger.info(f"[{self.node_id}] receive message from [{receiver_p2p_address}]: {response.reply}")
        return f"{response.reply}"

    def send_message(self, receiver_node_id, message):
        """
        send message to another node by providing receiver_node_id= agent_name and message = message
        """
        logger.info(f"[{self.node_id}] send msg to [{receiver_node_id}]: {message}")
        receiver_node = self.all_nodes.get(receiver_node_id, None)
        if not receiver_node:
            raise NodeUnavailableError(receiver_node)

        request = node_pb2.CallPeerRequest(sender_node_id=self.node_id, receiver_p2p_address=receiver_node["p2p_address"], message=message)

        # receiver_p2p_address = "/ip4/127.0.0.1/tcp/50706/ws/p2p/12D3KooWF5mcsBaMKdJ9Rc1A2cp6KWSsaJUVxG2YkXJduJAkiQTK/p2p-circuit/p2p/12D3KooWKQgxkeJAa1wUTGVCi8X3KpLxL7za51srd8m46PirmVvS"
        # request = node_pb2.CallPeerRequest(sender_node_id=self.node_id, receiver_p2p_address=receiver_p2p_address, message=message)

        # 调用远程服务方法
        response = self.p2p_server_stub.call_peer(request)
        # log the response
        logger.info(f"[{self.node_id}] receive message from [{receiver_node_id}]: {response.reply}")
        return f"{response.reply}"


    def get_nodes_by_vector(self, query, limit=20):
        return self.all_nodes.values()
        # todo
        # if len(self.all_nodes) > limit and self.node_index is not None:
        #     node_ids = self.node_index.search(query, limit=limit)
        #     results = [self.all_nodes[node_id] for node_id in node_ids]
        # else:
        #     results = self.all_nodes.values()
        # return results

    def call_peer(self, request, context):
        # 返回消息
        return node_pb2.CallPeerResponse(reply=self.on_message(request.sender_node_id, request.message))

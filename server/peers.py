import json
from typing import Dict


class Peer:
    def __init__(self, peer_id: str, addr: str, name: str):
        self.peer_id = peer_id
        self.addr = addr
        self.name = name

    def __repr__(self):
        return f"Peer(peer_id={self.peer_id}, addr={self.addr}, name={self.name})"

    @staticmethod
    def load_dict_from_file(filepath="peers.json") -> Dict[str, "Peer"]:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            raise ValueError("JSON file must contain an array of peers")

        peers = {}
        for item in data:
            peer = Peer(
                peer_id=item["peer_id"],
                addr=item["addr"],
                name=item["name"]
            )
            peers[peer.peer_id] = peer

        return peers


def get_by_peer_id(peer_id):
    peer_dict = Peer.load_dict_from_file()
    return peer_dict.get(peer_id, None)


def get_all_peers():
    return Peer.load_dict_from_file()

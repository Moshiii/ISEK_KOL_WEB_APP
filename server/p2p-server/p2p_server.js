import express from 'express';

import { createLibp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { identify, identifyPush } from '@libp2p/identify'
import { ping } from '@libp2p/ping'
import { webRTC } from '@libp2p/webrtc'
import { webSockets } from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import { lpStream } from 'it-length-prefixed-stream'
import {
  privateKeyFromProtobuf,
  privateKeyToProtobuf,
  generateKeyPair
} from '@libp2p/crypto/keys'

import { multiaddr, protocols } from '@multiformats/multiaddr'
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const WEBRTC_CODE = protocols('webrtc').code
export const CHAT_PROTOCOL = '/libp2p/examples/chat/1.0.0'
const QUERY_PATH = '/query'

// 从命令行参数读取端口
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='));
const agentPortArg = args.find(arg => arg.startsWith('--agent_port='));
if (!portArg || !agentPortArg) {
  console.error(`Usage: node ${process.argv[1]} --port=<port_number> --agent_port=<agent_port_number>`);
  process.exit(1);
}
const p2p_server_port = parseInt(portArg.split('=')[1], 10);
const isek_agent_port = parseInt(agentPortArg.split('=')[1], 10);

// 解决 __dirname 在 ES6 中不可用的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载 proto
const PROTO_PATH = path.join(__dirname, '..', 'isek', 'node', 'noderpc', 'node.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const isekNodeProto = grpc.loadPackageDefinition(packageDefinition).isek_node;

 const RELAY_ADDRESS = '/ip4/45.32.115.124/tcp/9090/ws/p2p/12D3KooWEm7y24CfhEUAvNcQH1osnwhHt3ibGYZdKdLpezQt1r4Y'
// const RELAY_ADDRESS = '/ip4/47.236.116.81/tcp/43923/ws/p2p/12D3KooWShxoTCLzDErVVnvfMtVxbXed8ok938v6Mq71bfPp7Y6y'
//const RELAY_ADDRESS = '/ip4/127.0.0.1/tcp/52533/ws/p2p/12D3KooWEDRrjHdsGA1kKYgUYKQtahYz2GguQB8aiFn3i5qZJAv4'

class P2PNode {
  constructor(name) {
    this.name = name
    this.handlers = {
      '/query': async (body) => {
        const client = new isekNodeProto.IsekP2PNodeService(`localhost:${isek_agent_port}`, grpc.credentials.createInsecure());

        const callPeerAsync = (request) => {
          return new Promise((resolve, reject) => {
            client.callPeer(request, (err, response) => {
              if (err) {
                return reject(err);
              }
              resolve(response.reply);
            });
          });
        };

        try {
          const reply = await callPeerAsync({
            senderNodeId: 'sender_node_id',
            receiverP2pAddress: 'receiver_p2p_address',
            message: body,
          });
    
          console.log('Greeting:', reply);
          return reply;
        } catch (err) {
          console.error('Error:', err);
          return { received: null, status: 'error', message: err.message };
        }
      }
    }
    this.requestHandler = this.requestHandler.bind(this)
    this.setup()
  }

  async setup() {
    try {
      await this.initP2P()
      await this.connectToPeer(RELAY_ADDRESS)
    } catch (err) {
      console.error('Setup failed:', err)
    }
  }

  registerHandler(path, fn) {
    this.handlers[path] = fn
  }

  async initP2P() {
    const privateKey = await this.getOrCreatePeerKey()

    this.node = await createLibp2p({
      privateKey: privateKey,
      addresses: { listen: ['/p2p-circuit', '/webrtc'] },
      transports: [
        webSockets({ filter: filters.all }),
        webRTC(),
        circuitRelayTransport()
      ],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      connectionGater: { denyDialMultiaddr: () => false },
      services: {
        identify: identify(),
        identifyPush: identifyPush(),
        ping: ping()
      }
    })

    await this.node.start()
    this.peerId = this.node.peerId.toString()
    console.log(`Libp2p node started, peer id: ${this.peerId}`)

    this.node.addEventListener('connection:open', () => {
      this.updateConnList()
    })
    this.node.addEventListener('connection:close', () => {
      this.updateConnList()
    })
    this.node.addEventListener('self:peer:update', () => {
      this.node.getMultiaddrs().forEach(ma => {
        if (ma.toString() == `${RELAY_ADDRESS}/p2p-circuit/p2p/${this.peerId}`) {
          this.listenAddress = ma.toString()
        }
        console.log(`Listening on ${ma.toString()}`)
      })
    })

    await this.node.handle(CHAT_PROTOCOL, this.requestHandler, { runOnLimitedConnection: true })
    return this.node
  }

  async updateConnList() {
    this.node.getConnections().forEach(c => {
      console.log(`Connection: ${c.remoteAddr.toString()}`)
    })
  }

  async getOrCreatePeerKey() {
    let privateKey
    const storedBase64 = null

    if (storedBase64) {
      try {
        const binaryString = atob(storedBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        privateKey = await privateKeyFromProtobuf(bytes)
        console.log(`Using existing private key`)
      } catch (err) {
        console.error('Error reading stored private key, generating a new one', err)
        privateKey = await generateKeyPair('Ed25519')
        await this.savePeerKey(privateKey)
      }
    } else {
      privateKey = await generateKeyPair('Ed25519')
      await this.savePeerKey(privateKey)
    }

    return privateKey
  }

  async savePeerKey(privateKey) {
    const protobufData = await privateKeyToProtobuf(privateKey)
    const base64Data = btoa(String.fromCharCode(...protobufData))
    console.log(`Stored new private key`)
  }

  async requestHandler({ stream }) {
    try {
      const lp = lpStream(stream)
      const req = await lp.read()
      const { path, body } = JSON.parse(new TextDecoder().decode(req.subarray()))

      console.log(`Received request: ${path}`)

      const handler = this.handlers[path]
      let response

      if (handler) {
        response = await handler(body)
      } else {
        response = { error: 'Not Found', status: 404 }
      }

      await lp.write(new TextEncoder().encode(JSON.stringify(response)))
    } catch (err) {
      console.error('Request handler error:', err)
    }
  }

  async callPeer(remoteAddrs, body) {
    const ma = multiaddr(remoteAddrs)
    const stream = await this.node.dialProtocol(ma, CHAT_PROTOCOL, { runOnLimitedConnection: true })
    const lp = lpStream(stream)

    await lp.write(new TextEncoder().encode(JSON.stringify({ path: QUERY_PATH, body: body })))
    const res = await lp.read()
    return JSON.parse(new TextDecoder().decode(res.subarray()))
  }

  async queryPeer(receiver_peerId, query) {
    const ma = multiaddr(`${RELAY_ADDRESS}/p2p-circuit/p2p/${receiver_peerId}`)
    console.log(`Querying peer ${receiver_peerId} at ${ma.toString()}`)
    return this.callPeer(ma, { name: this.name, query: query, peerid: this.peerId })
  }

  isWebRTC(ma) {
    return ma.protoCodes().includes(WEBRTC_CODE)
  }

  async connectToPeer(remoteAddr) {
    const ma = multiaddr(remoteAddr)
    console.log(`Attempting connection: ${ma.toString()}`)
    const timeoutMs = 5000

    try {
      if (this.isWebRTC(ma)) {
        const rtt = await this.node.services.ping.ping(ma, {
          signal: AbortSignal.timeout(timeoutMs)
        })
        console.log(`Connected to ${ma.toString()}, RTT: ${rtt} ms`)
      } else {
        await this.node.dial(ma, { signal: AbortSignal.timeout(timeoutMs) })
        console.log(`Connected to relay node: ${ma.toString()}`)
      }
    } catch (err) {
      console.error(`Failed to connect to ${ma.toString()}:`, err)
    }
  }
}

const n = new P2PNode("node_name");

// 实现服务
const callPeer = async (call, callback) => {
  const { senderNodeId, receiverP2pAddress, message } = call.request;
  const reply = await n.callPeer(receiverP2pAddress, message)
  console.log(`Received callPeer request: message=${message} senderNodeId=${senderNodeId}, receiverP2pAddress=${receiverP2pAddress}`);
  callback(null, {
    reply: JSON.stringify(reply)
    // p2p_address: n.listenAddress
  });
};

const p2pContext = (call, callback) => {
  console.log("peer_id: " + n.peerId);
  console.log("listenAddress: " + n.listenAddress);
  callback(null, {
    peerId: n.peerId,
    p2pAddress: n.listenAddress
  });
};

// 启动服务
const main = () => {
  const server = new grpc.Server();
  server.addService(isekNodeProto.IsekP2PNodeService.service, { p2p_context: p2pContext, call_peer: callPeer });
  server.bindAsync(`0.0.0.0:${p2p_server_port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Bind failed:', err);
      return;
    }
    // server.start();
    console.log(`gRPC server running at 0.0.0.0:${p2p_server_port}`);
  });
};

main();

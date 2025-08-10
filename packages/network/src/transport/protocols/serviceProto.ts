/**
 * TSRPC 服务协议定义
 * 定义API调用和消息类型
 */

import { ServiceProto } from 'tsrpc';
import {
  ReqJoinRoom, ResJoinRoom,
  ReqServerStatus, ResServerStatus,
  ReqPing, ResPing,
  MsgNetworkMessage,
  MsgSyncVar,
  MsgRpcCall,
  MsgNetworkObjectSpawn,
  MsgNetworkObjectDespawn,
  MsgClientDisconnected,
  MsgAuthorityChange
} from './NetworkProtocols';

/**
 * 网络服务协议
 * 定义所有可用的API和消息类型
 */
export const serviceProto: ServiceProto<ServiceType> = {
  "services": [
    {
      "id": 0,
      "name": "network/JoinRoom",
      "type": "api"
    },
    {
      "id": 1,
      "name": "network/ServerStatus",
      "type": "api"
    },
    {
      "id": 2,
      "name": "network/Ping",
      "type": "api"
    },
    {
      "id": 3,
      "name": "network/NetworkMessage",
      "type": "msg"
    },
    {
      "id": 4,
      "name": "network/SyncVar",
      "type": "msg"
    },
    {
      "id": 5,
      "name": "network/RpcCall",
      "type": "msg"
    },
    {
      "id": 6,
      "name": "network/NetworkObjectSpawn",
      "type": "msg"
    },
    {
      "id": 7,
      "name": "network/NetworkObjectDespawn",
      "type": "msg"
    },
    {
      "id": 8,
      "name": "network/ClientDisconnected",
      "type": "msg"
    },
    {
      "id": 9,
      "name": "network/AuthorityChange",
      "type": "msg"
    }
  ],
  "types": {}
};

/**
 * 服务类型定义
 * 用于类型安全的API调用和消息发送
 */
export interface ServiceType {
  api: {
    "network/JoinRoom": {
      req: ReqJoinRoom;
      res: ResJoinRoom;
    };
    "network/ServerStatus": {
      req: ReqServerStatus;
      res: ResServerStatus;
    };
    "network/Ping": {
      req: ReqPing;
      res: ResPing;
    };
  };
  msg: {
    "network/NetworkMessage": MsgNetworkMessage;
    "network/SyncVar": MsgSyncVar;
    "network/RpcCall": MsgRpcCall;
    "network/NetworkObjectSpawn": MsgNetworkObjectSpawn;
    "network/NetworkObjectDespawn": MsgNetworkObjectDespawn;
    "network/ClientDisconnected": MsgClientDisconnected;
    "network/AuthorityChange": MsgAuthorityChange;
  };
}
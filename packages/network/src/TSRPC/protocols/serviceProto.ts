/**
 * TSRPC 服务协议定义
 */
import { ServiceProto } from 'tsrpc-proto';

// API 协议
export interface ServiceType {
    api: {
        'SyncComponent': {
            req: import('./PtlSyncComponent').ReqSyncComponent;
            res: import('./PtlSyncComponent').ResSyncComponent;
        };
        'JoinRoom': {
            req: import('./PtlJoinRoom').ReqJoinRoom;
            res: import('./PtlJoinRoom').ResJoinRoom;
        };
        'Ping': {
            req: { timestamp: number };
            res: { timestamp: number; serverTime: number };
        };
    };
    msg: {
        'ComponentUpdate': import('./MsgComponentUpdate').MsgComponentUpdate;
        'RoomClosed': { roomId: string; reason: string };
        'PlayerJoined': { playerId: number; playerName?: string; timestamp: number };
        'PlayerLeft': { playerId: number; playerName?: string; timestamp: number };
        'PlayerKicked': { playerId: number; reason: string };
    };
}

export const serviceProto: ServiceProto<ServiceType> = {
    "version": 1,
    "services": [
        // API 服务
        {
            "id": 0,
            "name": "SyncComponent",
            "type": "api"
        },
        {
            "id": 1,
            "name": "JoinRoom", 
            "type": "api"
        },
        {
            "id": 2,
            "name": "Ping",
            "type": "api"
        },
        // 消息服务
        {
            "id": 3,
            "name": "ComponentUpdate",
            "type": "msg"
        },
        {
            "id": 4,
            "name": "RoomClosed",
            "type": "msg"
        },
        {
            "id": 5,
            "name": "PlayerJoined",
            "type": "msg"
        },
        {
            "id": 6,
            "name": "PlayerLeft",
            "type": "msg"
        },
        {
            "id": 7,
            "name": "PlayerKicked",
            "type": "msg"
        }
    ],
    "types": {}
};
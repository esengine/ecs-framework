/**
 * 加入房间协议
 */
export interface ReqJoinRoom {
    roomId: string;
    playerName?: string;
    password?: string;
}

export interface ResJoinRoom {
    success: boolean;
    playerId?: number;
    roomInfo?: {
        roomId: string;
        playerCount: number;
        maxPlayers: number;
        metadata?: Record<string, any>;
    };
    errorMsg?: string;
}
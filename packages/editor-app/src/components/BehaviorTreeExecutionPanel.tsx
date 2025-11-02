import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Copy } from 'lucide-react';

interface ExecutionLog {
    timestamp: number;
    message: string;
    level: 'info' | 'success' | 'error' | 'warning';
    nodeId?: string;
}

interface BehaviorTreeExecutionPanelProps {
    logs: ExecutionLog[];
    onClearLogs: () => void;
    isRunning: boolean;
    tickCount: number;
    executionSpeed: number;
    onSpeedChange: (speed: number) => void;
}

export const BehaviorTreeExecutionPanel: React.FC<BehaviorTreeExecutionPanelProps> = ({
    logs,
    onClearLogs,
    isRunning,
    tickCount,
    executionSpeed,
    onSpeedChange
}) => {
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    // 自动滚动到底部
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'warning': return '#ff9800';
            default: return '#2196f3';
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'success': return '✓';
            case 'error': return '✗';
            case 'warning': return '⚠';
            default: return 'ℹ';
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
    };

    const handleCopyLogs = () => {
        const logsText = logs.map((log) =>
            `${formatTime(log.timestamp)} ${getLevelIcon(log.level)} ${log.message}`
        ).join('\n');

        navigator.clipboard.writeText(logsText).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }).catch((err) => {
            console.error('复制失败:', err);
        });
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            fontFamily: 'Consolas, monospace',
            fontSize: '12px'
        }}>
            {/* 标题栏 */}
            <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#252526'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 'bold' }}>执行控制台</span>
                    {isRunning && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '2px 8px',
                            backgroundColor: '#4caf50',
                            borderRadius: '3px',
                            fontSize: '11px'
                        }}>
                            <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#fff',
                                animation: 'pulse 1s infinite'
                            }} />
                            运行中
                        </div>
                    )}
                    <span style={{ color: '#888', fontSize: '11px' }}>
                        Tick: {tickCount}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* 速度控制 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#888', fontSize: '11px', minWidth: '60px' }}>
                            速度: {executionSpeed.toFixed(2)}x
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => onSpeedChange(0.05)}
                                style={{
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    backgroundColor: executionSpeed === 0.05 ? '#0e639c' : 'transparent',
                                    border: '1px solid #555',
                                    borderRadius: '2px',
                                    color: '#d4d4d4',
                                    cursor: 'pointer'
                                }}
                                title="超慢速 (每秒3次)"
                            >
                                0.05x
                            </button>
                            <button
                                onClick={() => onSpeedChange(0.2)}
                                style={{
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    backgroundColor: executionSpeed === 0.2 ? '#0e639c' : 'transparent',
                                    border: '1px solid #555',
                                    borderRadius: '2px',
                                    color: '#d4d4d4',
                                    cursor: 'pointer'
                                }}
                                title="慢速 (每秒12次)"
                            >
                                0.2x
                            </button>
                            <button
                                onClick={() => onSpeedChange(1.0)}
                                style={{
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    backgroundColor: executionSpeed === 1.0 ? '#0e639c' : 'transparent',
                                    border: '1px solid #555',
                                    borderRadius: '2px',
                                    color: '#d4d4d4',
                                    cursor: 'pointer'
                                }}
                                title="正常速度 (每秒60次)"
                            >
                                1.0x
                            </button>
                        </div>
                        <input
                            type="range"
                            min="0.01"
                            max="2"
                            step="0.01"
                            value={executionSpeed}
                            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                            style={{
                                width: '80px',
                                accentColor: '#0e639c'
                            }}
                            title="调整执行速度"
                        />
                    </div>

                    <button
                        onClick={handleCopyLogs}
                        style={{
                            padding: '6px',
                            backgroundColor: copySuccess ? '#4caf50' : 'transparent',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: logs.length === 0 ? '#666' : '#d4d4d4',
                            cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            opacity: logs.length === 0 ? 0.5 : 1,
                            transition: 'background-color 0.2s'
                        }}
                        title={copySuccess ? '已复制!' : '复制日志'}
                        disabled={logs.length === 0}
                    >
                        <Copy size={12} />
                    </button>

                    <button
                        onClick={onClearLogs}
                        style={{
                            padding: '6px',
                            backgroundColor: 'transparent',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: '#d4d4d4',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px'
                        }}
                        title="清空日志"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* 日志内容 */}
            <div
                ref={logContainerRef}
                className="execution-panel-logs"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px',
                    backgroundColor: '#1e1e1e'
                }}
            >
                {logs.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#666',
                        fontSize: '13px'
                    }}>
                        点击 Play 按钮开始执行行为树
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                gap: '8px',
                                padding: '4px 0',
                                borderBottom: index < logs.length - 1 ? '1px solid #2a2a2a' : 'none'
                            }}
                        >
                            <span style={{
                                color: '#666',
                                fontSize: '11px',
                                minWidth: '80px'
                            }}>
                                {formatTime(log.timestamp)}
                            </span>
                            <span style={{
                                color: getLevelColor(log.level),
                                fontWeight: 'bold',
                                minWidth: '16px'
                            }}>
                                {getLevelIcon(log.level)}
                            </span>
                            <span style={{
                                flex: 1,
                                color: log.level === 'error' ? '#f44336' : '#d4d4d4'
                            }}>
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* 底部状态栏 */}
            <div style={{
                padding: '6px 12px',
                borderTop: '1px solid #333',
                backgroundColor: '#252526',
                fontSize: '11px',
                color: '#888',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <span>{logs.length} 条日志</span>
                <span>{isRunning ? '正在运行' : '已停止'}</span>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                /* 自定义滚动条样式 */
                .execution-panel-logs::-webkit-scrollbar {
                    width: 8px;
                }

                .execution-panel-logs::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }

                .execution-panel-logs::-webkit-scrollbar-thumb {
                    background: #424242;
                    border-radius: 4px;
                }

                .execution-panel-logs::-webkit-scrollbar-thumb:hover {
                    background: #4e4e4e;
                }

                /* Firefox 滚动条样式 */
                .execution-panel-logs {
                    scrollbar-width: thin;
                    scrollbar-color: #424242 #1e1e1e;
                }
            `}</style>
        </div>
    );
};

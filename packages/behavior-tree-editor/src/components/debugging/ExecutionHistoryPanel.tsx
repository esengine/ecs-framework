import React, { useState } from 'react';
import { Clock, TrendingUp, XCircle, CheckCircle, Activity } from 'lucide-react';
import { useExecutionStatsStore, ExecutionPath } from '../../stores/ExecutionStatsStore';
import { DraggablePanel } from '../common/DraggablePanel';
import { BehaviorTreeNode } from '../../stores';

interface ExecutionHistoryPanelProps {
    isVisible: boolean;
    onClose: () => void;
    nodes: BehaviorTreeNode[];
}

/**
 * 执行历史面板
 * 显示所有执行路径和统计信息
 */
export const ExecutionHistoryPanel: React.FC<ExecutionHistoryPanelProps> = ({ isVisible, onClose, nodes }) => {
    const executionPaths = useExecutionStatsStore((state) => state.executionPaths);
    const currentPathId = useExecutionStatsStore((state) => state.currentPathId);
    const clearHistory = useExecutionStatsStore((state) => state.clearHistory);
    const clearStats = useExecutionStatsStore((state) => state.clearStats);
    const exportStats = useExecutionStatsStore((state) => state.exportStats);

    const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

    if (!isVisible) return null;

    const selectedPath = selectedPathId
        ? executionPaths.find((p) => p.id === selectedPathId)
        : undefined;

    const handleExport = () => {
        const data = exportStats();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `execution-stats-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const headerActions = (
        <>
            <button
                onClick={handleExport}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    padding: '4px 8px',
                    backgroundColor: '#3c3c3c',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ccc',
                    fontSize: '11px',
                    cursor: 'pointer'
                }}
                title="导出统计数据"
            >
                导出
            </button>
            <button
                onClick={() => {
                    if (confirm('确定要清空所有统计数据吗？')) {
                        clearStats();
                        clearHistory();
                    }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    padding: '4px 8px',
                    backgroundColor: '#3c3c3c',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ccc',
                    fontSize: '11px',
                    cursor: 'pointer'
                }}
                title="清空历史"
            >
                清空
            </button>
        </>
    );

    return (
        <DraggablePanel
            title="执行历史"
            icon={<Clock size={18} color="#2196f3" />}
            isVisible={isVisible}
            onClose={onClose}
            width={400}
            maxHeight={600}
            initialPosition={{ x: window.innerWidth - 440, y: 100 }}
            headerActions={headerActions}
            footer={selectedPath && <PathDetails path={selectedPath} nodes={nodes} />}
        >
            <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
                {executionPaths.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#666',
                        padding: '40px 20px',
                        fontSize: '13px'
                    }}>
                        <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <div>暂无执行历史</div>
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>
                            运行行为树后将显示执行记录
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {executionPaths.slice().reverse().map((path) => (
                            <PathCard
                                key={path.id}
                                path={path}
                                isActive={path.id === currentPathId}
                                isSelected={path.id === selectedPathId}
                                onClick={() => setSelectedPathId(path.id === selectedPathId ? null : path.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DraggablePanel>
    );
};

interface PathCardProps {
    path: ExecutionPath;
    isActive: boolean;
    isSelected: boolean;
    onClick: () => void;
}

const PathCard: React.FC<PathCardProps> = ({ path, isActive, isSelected, onClick }) => {
    const duration = path.endTime ? path.endTime - path.startTime : Date.now() - path.startTime;
    const successCount = path.history.filter((h) => h.status === 'success').length;
    const failureCount = path.history.filter((h) => h.status === 'failure').length;

    return (
        <div
            onClick={onClick}
            style={{
                padding: '10px',
                backgroundColor: isSelected ? '#2a2a2a' : '#252525',
                border: `1px solid ${isActive ? '#2196f3' : '#3f3f3f'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
            }}>
                <span style={{
                    fontSize: '11px',
                    color: '#999',
                    fontFamily: 'monospace'
                }}>
                    {new Date(path.startTime).toLocaleTimeString()}
                </span>
                {isActive && (
                    <span style={{
                        fontSize: '10px',
                        color: '#2196f3',
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        padding: '2px 6px',
                        borderRadius: '3px'
                    }}>
                        执行中
                    </span>
                )}
            </div>

            <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} color="#4caf50" />
                    <span style={{ color: '#4caf50' }}>{successCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={14} color="#f44336" />
                    <span style={{ color: '#f44336' }}>{failureCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    <Clock size={14} color="#999" />
                    <span style={{ color: '#999' }}>{duration.toFixed(0)}ms</span>
                </div>
            </div>
        </div>
    );
};

interface PathDetailsProps {
    path: ExecutionPath;
    nodes: BehaviorTreeNode[];
}

const PathDetails: React.FC<PathDetailsProps> = ({ path, nodes }) => {
    const getNodeName = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        return node?.template.displayName || nodeId;
    };
    return (
        <div style={{ padding: '12px' }}>
            <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '8px'
            }}>
                执行详情 ({path.history.length} 条记录)
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '11px'
            }}>
                {path.history.map((entry, index) => (
                    <div
                        key={index}
                        style={{
                            padding: '6px 8px',
                            backgroundColor: '#1e1e1e',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{
                                color: '#2196f3',
                                fontWeight: 'bold',
                                minWidth: '20px'
                            }}>
                                #{entry.executionOrder}
                            </span>
                            <span style={{
                                color: '#ccc',
                                fontSize: '11px',
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }} title={entry.nodeId}>
                                {getNodeName(entry.nodeId)}
                            </span>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {entry.duration !== undefined && (
                                <span style={{ color: '#999' }}>
                                    {entry.duration.toFixed(1)}ms
                                </span>
                            )}
                            <span style={{
                                color: entry.status === 'success' ? '#4caf50' :
                                       entry.status === 'failure' ? '#f44336' : '#2196f3'
                            }}>
                                {entry.status === 'success' ? '✓' :
                                 entry.status === 'failure' ? '✗' : '●'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Bug, Circle, PlayCircle, PauseCircle, StopCircle, SkipForward } from 'lucide-react';
import { DraggablePanel } from '../common/DraggablePanel';
import { BehaviorTreeNode } from '../../stores';

export interface Breakpoint {
    nodeId: string;
    enabled: boolean;
    condition?: string;
}

interface DebugControlPanelProps {
    isVisible: boolean;
    breakpoints: Map<string, Breakpoint>;
    isPaused: boolean;
    nodes: BehaviorTreeNode[];
    onClose: () => void;
    onToggleBreakpoint: (nodeId: string) => void;
    onRemoveBreakpoint: (nodeId: string) => void;
    onClearAllBreakpoints: () => void;
    onPause: () => void;
    onResume: () => void;
    onStep: () => void;
    onStop: () => void;
}

/**
 * 调试控制面板
 * 管理断点、暂停/继续执行
 */
export const DebugControlPanel: React.FC<DebugControlPanelProps> = ({
    isVisible,
    breakpoints,
    isPaused,
    nodes,
    onClose,
    onToggleBreakpoint,
    onRemoveBreakpoint,
    onClearAllBreakpoints,
    onPause,
    onResume,
    onStep,
    onStop
}) => {
    const [showAddBreakpoint, setShowAddBreakpoint] = useState(false);
    const [newBreakpointNodeId, setNewBreakpointNodeId] = useState('');

    if (!isVisible) return null;

    const breakpointList = Array.from(breakpoints.values());

    const footer = (
        <div style={{
            padding: '8px 12px',
            fontSize: '11px',
            color: '#999',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        }}>
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isPaused ? '#f44336' : '#4caf50'
            }} />
            <span style={{ color: isPaused ? '#f44336' : '#4caf50' }}>
                {isPaused ? '已在断点处暂停' : '运行中'}
            </span>
        </div>
    );

    return (
        <DraggablePanel
            title="调试控制"
            icon={<Bug size={18} color="#ff9800" />}
            isVisible={isVisible}
            onClose={onClose}
            width={350}
            maxHeight={500}
            initialPosition={{ x: window.innerWidth - 390, y: 100 }}
            footer={footer}
        >

            {/* 控制按钮组 */}
            <div style={{
                padding: '12px',
                borderBottom: '1px solid #3f3f3f',
                display: 'flex',
                gap: '8px'
            }}>
                <ControlButton
                    icon={<PlayCircle size={16} />}
                    label="继续"
                    disabled={!isPaused}
                    onClick={onResume}
                    color="#4caf50"
                />
                <ControlButton
                    icon={<PauseCircle size={16} />}
                    label="暂停"
                    disabled={isPaused}
                    onClick={onPause}
                    color="#ff9800"
                />
                <ControlButton
                    icon={<SkipForward size={16} />}
                    label="单步"
                    disabled={!isPaused}
                    onClick={onStep}
                    color="#2196f3"
                />
                <ControlButton
                    icon={<StopCircle size={16} />}
                    label="停止"
                    onClick={onStop}
                    color="#f44336"
                />
            </div>

            {/* 断点列表 */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#fff'
                    }}>
                        断点 ({breakpointList.length})
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={() => setShowAddBreakpoint(!showAddBreakpoint)}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: '#3c3c3c',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#ccc',
                                fontSize: '11px',
                                cursor: 'pointer'
                            }}
                        >
                            + 添加
                        </button>
                        {breakpointList.length > 0 && (
                            <button
                                onClick={onClearAllBreakpoints}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#3c3c3c',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#ccc',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                            >
                                清空
                            </button>
                        )}
                    </div>
                </div>

                {/* 添加断点输入 */}
                {showAddBreakpoint && (
                    <div style={{
                        marginBottom: '12px',
                        padding: '8px',
                        backgroundColor: '#252525',
                        borderRadius: '6px'
                    }}>
                        <input
                            type="text"
                            placeholder="节点ID"
                            value={newBreakpointNodeId}
                            onChange={(e) => setNewBreakpointNodeId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px',
                                backgroundColor: '#1e1e1e',
                                border: '1px solid #3f3f3f',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '12px',
                                marginBottom: '8px'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => {
                                    if (newBreakpointNodeId.trim()) {
                                        // TODO: 实际添加断点逻辑需要在父组件实现
                                        setNewBreakpointNodeId('');
                                        setShowAddBreakpoint(false);
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: '6px',
                                    backgroundColor: '#4caf50',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                            >
                                添加
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddBreakpoint(false);
                                    setNewBreakpointNodeId('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '6px',
                                    backgroundColor: '#3c3c3c',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#ccc',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                        </div>
                    </div>
                )}

                {/* 断点列表 */}
                {breakpointList.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#666',
                        padding: '20px',
                        fontSize: '12px'
                    }}>
                        暂无断点
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>
                            右键点击节点可添加断点
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        {breakpointList.map((bp) => (
                            <BreakpointItem
                                key={bp.nodeId}
                                breakpoint={bp}
                                nodes={nodes}
                                onToggle={() => onToggleBreakpoint(bp.nodeId)}
                                onRemove={() => onRemoveBreakpoint(bp.nodeId)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DraggablePanel>
    );
};

interface ControlButtonProps {
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    onClick: () => void;
    color: string;
}

const ControlButton: React.FC<ControlButtonProps> = ({ icon, label, disabled, onClick, color }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={label}
        style={{
            flex: 1,
            padding: '8px',
            backgroundColor: disabled ? '#2a2a2a' : color,
            border: 'none',
            borderRadius: '6px',
            color: disabled ? '#666' : '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            transition: 'all 0.2s',
            opacity: disabled ? 0.5 : 1
        }}
    >
        {icon}
        <span>{label}</span>
    </button>
);

interface BreakpointItemProps {
    breakpoint: Breakpoint;
    nodes: BehaviorTreeNode[];
    onToggle: () => void;
    onRemove: () => void;
}

const BreakpointItem: React.FC<BreakpointItemProps> = ({ breakpoint, nodes, onToggle, onRemove }) => {
    const node = nodes.find(n => n.id === breakpoint.nodeId);
    const nodeName = node?.template.displayName || breakpoint.nodeId;

    return (
    <div style={{
        padding: '8px',
        backgroundColor: '#252525',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    }}>
        <button
            onClick={onToggle}
            style={{
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
            }}
            title={breakpoint.enabled ? '禁用断点' : '启用断点'}
        >
            <Circle
                size={14}
                fill={breakpoint.enabled ? '#f44336' : 'transparent'}
                color={breakpoint.enabled ? '#f44336' : '#666'}
            />
        </button>

        <div style={{ flex: 1, fontSize: '12px' }}>
            <div style={{
                color: '#fff',
                fontSize: '11px',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }} title={`${nodeName} (${breakpoint.nodeId})`}>
                {nodeName}
            </div>
            <div style={{
                color: '#666',
                fontSize: '9px',
                fontFamily: 'Consolas, Monaco, monospace',
                marginTop: '2px',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }} title={breakpoint.nodeId}>
                #{breakpoint.nodeId}
            </div>
            {breakpoint.condition && (
                <div style={{
                    color: '#999',
                    fontSize: '10px',
                    marginTop: '2px'
                }}>
                    条件: {breakpoint.condition}
                </div>
            )}
        </div>

        <button
            onClick={onRemove}
            style={{
                padding: '4px 8px',
                backgroundColor: '#3c3c3c',
                border: 'none',
                borderRadius: '4px',
                color: '#ccc',
                fontSize: '10px',
                cursor: 'pointer'
            }}
        >
            删除
        </button>
    </div>
    );
};

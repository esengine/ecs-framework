import React, { useState, useRef, useEffect } from 'react';
import { NodeTemplate } from '@esengine/behavior-tree';
import { TreePine, Play, Pause, Square, SkipForward, RotateCcw, Trash2 } from 'lucide-react';

type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failure';
type ExecutionMode = 'idle' | 'running' | 'paused' | 'step';

interface BehaviorTreeNode {
    id: string;
    template: NodeTemplate;
    data: Record<string, any>;
    position: { x: number; y: number };
    children: string[];
}

interface Connection {
    from: string;
    to: string;
}

interface BehaviorTreeEditorProps {
    onNodeSelect?: (node: BehaviorTreeNode) => void;
    onNodeCreate?: (template: NodeTemplate, position: { x: number; y: number }) => void;
    blackboardVariables?: Record<string, any>;
}

/**
 * 行为树编辑器主组件
 *
 * 提供可视化的行为树编辑画布
 */
const ROOT_NODE_ID = 'root-node';

export const BehaviorTreeEditor: React.FC<BehaviorTreeEditorProps> = ({
    onNodeSelect,
    onNodeCreate,
    blackboardVariables = {}
}) => {
    // 创建固定的 Root 节点
    const rootNodeTemplate: NodeTemplate = {
        type: 'composite' as any,
        displayName: 'Root',
        category: 'Root',
        icon: '🌳',
        description: '行为树根节点',
        color: '#FFD700',
        defaultConfig: {
            nodeType: 'root'
        },
        properties: []
    };

    const [nodes, setNodes] = useState<BehaviorTreeNode[]>([
        {
            id: ROOT_NODE_ID,
            template: rootNodeTemplate,
            data: { nodeType: 'root' },
            position: { x: 400, y: 100 },
            children: []
        }
    ]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
    const [connectingToPos, setConnectingToPos] = useState<{ x: number; y: number } | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // 画布变换
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [canvasScale, setCanvasScale] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // 运行状态
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('idle');
    const [nodeExecutionStatus, setNodeExecutionStatus] = useState<Record<string, NodeExecutionStatus>>({});
    const [executionHistory, setExecutionHistory] = useState<string[]>([]);
    const executionTimerRef = useRef<number | null>(null);
    const executionModeRef = useRef<ExecutionMode>('idle');
    const [tickCount, setTickCount] = useState(0);


    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        try {
            let templateData = e.dataTransfer.getData('application/behavior-tree-node');
            if (!templateData) {
                templateData = e.dataTransfer.getData('text/plain');
            }
            if (!templateData) {
                return;
            }

            const template: NodeTemplate = JSON.parse(templateData);
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            // 将鼠标坐标转换为画布坐标系
            const position = {
                x: (e.clientX - rect.left - canvasOffset.x) / canvasScale,
                y: (e.clientY - rect.top - canvasOffset.y) / canvasScale
            };

            const newNode: BehaviorTreeNode = {
                id: `node_${Date.now()}`,
                template,
                data: { ...template.defaultConfig },
                position,
                children: []
            };

            setNodes(prev => [...prev, newNode]);
            onNodeCreate?.(template, position);
        } catch (error) {
            console.error('Failed to create node:', error);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragging) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleNodeClick = (node: BehaviorTreeNode) => {
        setSelectedNodeId(node.id);
        onNodeSelect?.(node);
    };

    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        // Root 节点不能拖动
        if (nodeId === ROOT_NODE_ID) return;

        // 检查是否点击的是端口（通过检查 target 的类名或其他属性）
        const target = e.target as HTMLElement;
        if (target.getAttribute('data-port')) {
            return;
        }

        e.stopPropagation();
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // 将鼠标坐标转换为画布坐标系
        const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
        const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;

        setDraggingNodeId(nodeId);
        setDragOffset({
            x: canvasX - node.position.x,
            y: canvasY - node.position.y
        });
    };

    const handleNodeMouseMove = (e: React.MouseEvent) => {
        if (!draggingNodeId) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // 将鼠标坐标转换为画布坐标系
        const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
        const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;

        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;

        setNodes(prev => prev.map(node =>
            node.id === draggingNodeId
                ? { ...node, position: { x: newX, y: newY } }
                : node
        ));
    };

    const handleNodeMouseUp = () => {
        setDraggingNodeId(null);
    };

    const handlePortMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setConnectingFrom(nodeId);
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        // 处理连接线拖拽
        if (connectingFrom && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            // 将鼠标坐标转换为画布坐标系
            const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
            const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
            setConnectingToPos({
                x: canvasX,
                y: canvasY
            });
        }

        // 处理画布平移
        if (isPanning) {
            setCanvasOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
    };

    const handlePortMouseUp = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        if (connectingFrom && connectingFrom !== nodeId) {
            // Root 节点只能有一个子节点
            if (connectingFrom === ROOT_NODE_ID) {
                const rootNode = nodes.find(n => n.id === ROOT_NODE_ID);
                if (rootNode && rootNode.children.length > 0) {
                    alert('Root 节点只能连接一个子节点');
                    setConnectingFrom(null);
                    setConnectingToPos(null);
                    return;
                }
            }

            // 检查是否已经存在连接
            const existingConnection = connections.find(
                conn => conn.from === connectingFrom && conn.to === nodeId
            );
            if (!existingConnection) {
                setConnections(prev => [...prev, { from: connectingFrom, to: nodeId }]);
                // 更新节点的 children
                setNodes(prev => prev.map(node =>
                    node.id === connectingFrom
                        ? { ...node, children: [...node.children, nodeId] }
                        : node
                ));
            }
        }
        setConnectingFrom(null);
        setConnectingToPos(null);
    };

    const handleCanvasMouseUp = () => {
        setConnectingFrom(null);
        setConnectingToPos(null);
        setIsPanning(false);
    };

    // 画布缩放
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(3, canvasScale * delta));
        setCanvasScale(newScale);
    };

    // 画布平移
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
        }
    };

    // 重置视图
    const handleResetView = () => {
        setCanvasOffset({ x: 0, y: 0 });
        setCanvasScale(1);
    };

    // 运行控制函数
    const simulateNodeExecution = async (nodeId: string): Promise<NodeExecutionStatus> => {
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
        setExecutionHistory(prev => [...prev, `Executing: ${nodes.find(n => n.id === nodeId)?.template.displayName}`]);

        await new Promise(resolve => setTimeout(resolve, 800));

        const node = nodes.find(n => n.id === nodeId);
        if (!node) return 'failure';

        let status: NodeExecutionStatus = 'success';

        // Root 节点直接执行子节点
        if (nodeId === ROOT_NODE_ID) {
            if (node.children.length > 0) {
                status = await simulateNodeExecution(node.children[0]);
            }
            setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: status }));
            return status;
        }

        if (node.template.type === 'condition') {
            const checkKey = node.data.checkKey as string;
            const checkValue = node.data.checkValue;
            const actualValue = blackboardVariables[checkKey];
            status = actualValue === checkValue ? 'success' : 'failure';
        } else if (node.template.type === 'action') {
            status = Math.random() > 0.3 ? 'success' : 'failure';
        } else if (node.template.type === 'composite') {
            if (node.data.compositeType === 'sequence') {
                for (const childId of node.children) {
                    const childStatus = await simulateNodeExecution(childId);
                    if (childStatus === 'failure') {
                        status = 'failure';
                        break;
                    }
                }
            } else if (node.data.compositeType === 'selector') {
                status = 'failure';
                for (const childId of node.children) {
                    const childStatus = await simulateNodeExecution(childId);
                    if (childStatus === 'success') {
                        status = 'success';
                        break;
                    }
                }
            } else {
                for (const childId of node.children) {
                    await simulateNodeExecution(childId);
                }
            }
        } else if (node.template.type === 'decorator') {
            if (node.children.length > 0) {
                status = await simulateNodeExecution(node.children[0]);
            }
        }

        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: status }));
        setExecutionHistory(prev => [...prev, `${node.template.displayName}: ${status}`]);
        return status;
    };

    const handlePlay = async () => {
        if (executionModeRef.current === 'running') return;

        executionModeRef.current = 'running';
        setExecutionMode('running');
        setNodeExecutionStatus({});
        setExecutionHistory(['Starting execution from Root...']);
        setTickCount(0);

        let currentTick = 0;
        const runLoop = async () => {
            while (executionModeRef.current === 'running') {
                currentTick++;
                setTickCount(currentTick);
                setExecutionHistory(prev => [...prev, `\n--- Tick ${currentTick} ---`]);

                setNodeExecutionStatus({});

                await simulateNodeExecution(ROOT_NODE_ID);

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            setExecutionHistory(prev => [...prev, `Execution stopped after ${currentTick} ticks`]);
        };

        runLoop();
    };

    const handlePause = async () => {
        if (executionModeRef.current === 'running') {
            executionModeRef.current = 'paused';
            setExecutionMode('paused');
            setExecutionHistory(prev => [...prev, 'Execution paused']);
        } else if (executionModeRef.current === 'paused') {
            executionModeRef.current = 'running';
            setExecutionMode('running');
            setExecutionHistory(prev => [...prev, 'Execution resumed']);

            let currentTick = tickCount;
            const runLoop = async () => {
                while (executionModeRef.current === 'running') {
                    currentTick++;
                    setTickCount(currentTick);
                    setExecutionHistory(prev => [...prev, `\n--- Tick ${currentTick} ---`]);

                    setNodeExecutionStatus({});

                    await simulateNodeExecution(ROOT_NODE_ID);

                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                setExecutionHistory(prev => [...prev, `Execution stopped after ${currentTick} ticks`]);
            };

            runLoop();
        }
    };

    const handleStop = () => {
        executionModeRef.current = 'idle';
        setExecutionMode('idle');
        setNodeExecutionStatus({});
        setExecutionHistory([]);
        setTickCount(0);
        if (executionTimerRef.current) {
            clearInterval(executionTimerRef.current);
            executionTimerRef.current = null;
        }
    };

    const handleStep = async () => {
        setExecutionMode('step');
    };

    const handleReset = () => {
        handleStop();
        setExecutionHistory(['Reset to initial state']);
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            flex: 1,
            backgroundColor: '#1e1e1e',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.02);
                    }
                }
            `}</style>
            {/* 画布 */}
            <div
                ref={canvasRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onWheel={handleWheel}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={(e) => {
                    handleNodeMouseMove(e);
                    handleCanvasMouseMove(e);
                }}
                onMouseUp={(e) => {
                    handleNodeMouseUp();
                    handleCanvasMouseUp();
                }}
                onMouseLeave={(e) => {
                    handleNodeMouseUp();
                    handleCanvasMouseUp();
                }}
                style={{
                    flex: 1,
                    width: '100%',
                    backgroundImage: `
                        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: `${20 * canvasScale}px ${20 * canvasScale}px`,
                    backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
                    position: 'relative',
                    minHeight: 0,
                    overflow: 'hidden',
                    cursor: isPanning ? 'grabbing' : (draggingNodeId ? 'grabbing' : (connectingFrom ? 'crosshair' : 'default'))
                }}
            >
                {/* 内容容器 - 应用变换 */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
                    transformOrigin: '0 0',
                    position: 'relative'
                }}>
                {/* SVG 连接线层 */}
                <svg style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '10000px',
                    height: '10000px',
                    pointerEvents: 'none',
                    zIndex: 0,
                    overflow: 'visible'
                }}>
                    {/* 已有的连接 */}
                    {connections.map((conn, index) => {
                        const fromNode = nodes.find(n => n.id === conn.from);
                        const toNode = nodes.find(n => n.id === conn.to);
                        if (!fromNode || !toNode) return null;

                        const x1 = fromNode.position.x;
                        const y1 = fromNode.position.y + 30;
                        const x2 = toNode.position.x;
                        const y2 = toNode.position.y - 30;

                        const controlY = y1 + (y2 - y1) * 0.5;

                        return (
                            <path
                                key={index}
                                d={`M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`}
                                stroke="#0e639c"
                                strokeWidth="2"
                                fill="none"
                            />
                        );
                    })}
                    {/* 正在拖拽的连接线 */}
                    {connectingFrom && connectingToPos && (() => {
                        const fromNode = nodes.find(n => n.id === connectingFrom);
                        if (!fromNode) return null;

                        const x1 = fromNode.position.x;
                        const y1 = fromNode.position.y + 30;
                        const x2 = connectingToPos.x;
                        const y2 = connectingToPos.y;

                        const controlY = y1 + (y2 - y1) * 0.5;

                        return (
                            <path
                                d={`M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`}
                                stroke="#0e639c"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray="5,5"
                            />
                        );
                    })()}
                </svg>

                {/* 拖拽提示 */}
                {isDragging && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        padding: '20px 40px',
                        backgroundColor: 'rgba(14, 99, 156, 0.2)',
                        border: '2px dashed #0e639c',
                        borderRadius: '8px',
                        color: '#0e639c',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 1000
                    }}>
                        释放以创建节点
                    </div>
                )}

                {/* 节点列表 */}
                {nodes.map(node => {
                    const executionStatus = nodeExecutionStatus[node.id] || 'idle';
                    const isRoot = node.id === ROOT_NODE_ID;
                    const getStatusColor = () => {
                        if (selectedNodeId === node.id) return '#0e639c';
                        switch (executionStatus) {
                            case 'running': return '#ffa726';
                            case 'success': return '#4caf50';
                            case 'failure': return '#f44336';
                            default: return isRoot ? '#FFD700' : '#444';
                        }
                    };
                    const statusColor = getStatusColor();

                    return (
                    <div
                        key={node.id}
                        onClick={() => handleNodeClick(node)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{
                            position: 'absolute',
                            left: node.position.x,
                            top: node.position.y,
                            transform: 'translate(-50%, -50%)',
                            minWidth: '150px',
                            padding: '12px',
                            backgroundColor: isRoot ? '#3d3d1e' : '#2d2d2d',
                            borderTop: `2px solid ${statusColor}`,
                            borderRight: `2px solid ${statusColor}`,
                            borderBottom: `2px solid ${statusColor}`,
                            borderLeft: `4px solid ${isRoot ? '#FFD700' : (node.template.color || '#666')}`,
                            borderRadius: '6px',
                            cursor: isRoot ? 'default' : (draggingNodeId === node.id ? 'grabbing' : 'grab'),
                            boxShadow: executionStatus === 'running'
                                ? `0 0 20px ${statusColor}`
                                : isRoot ? '0 4px 12px rgba(255, 215, 0, 0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
                            transition: draggingNodeId === node.id ? 'none' : 'all 0.2s',
                            zIndex: isRoot ? 50 : (draggingNodeId === node.id ? 100 : (selectedNodeId === node.id ? 10 : 1)),
                            userSelect: 'none',
                            opacity: executionStatus === 'running' ? 0.9 : 1,
                            animation: executionStatus === 'running' ? 'pulse 1s infinite' : 'none'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '6px'
                        }}>
                            {isRoot ? (
                                <TreePine size={18} color="#FFD700" style={{ marginRight: '8px' }} />
                            ) : (
                                node.template.icon && (
                                    <span style={{ marginRight: '8px', fontSize: '18px' }}>
                                        {node.template.icon}
                                    </span>
                                )
                            )}
                            <strong style={{
                                fontSize: '14px',
                                color: isRoot ? '#FFD700' : '#cccccc'
                            }}>
                                {isRoot ? 'ROOT' : node.template.displayName}
                            </strong>
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#666'
                        }}>
                            {node.template.category}
                        </div>

                        {/* 输入端口（顶部）- Root 节点不显示 */}
                        {!isRoot && (
                            <div
                                data-port="true"
                                onMouseUp={(e) => handlePortMouseUp(e, node.id)}
                                style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    backgroundColor: '#0e639c',
                                    border: '2px solid #1e1e1e',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                                title="Input"
                            />
                        )}

                        {/* 输出端口（底部） */}
                        <div
                            data-port="true"
                            onMouseDown={(e) => handlePortMouseDown(e, node.id)}
                            style={{
                                position: 'absolute',
                                bottom: '-8px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#0e639c',
                                border: '2px solid #1e1e1e',
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                            title="Output"
                        />
                    </div>
                    );
                })}

                {/* 空状态提示 */}
                {nodes.length === 1 && !isDragging && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '14px',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>👇</div>
                        <div style={{ marginBottom: '10px' }}>从左侧拖拽节点到 Root 下方开始创建行为树</div>
                        <div style={{ fontSize: '12px', color: '#555' }}>
                            先连接 Root 节点与第一个节点
                        </div>
                    </div>
                )}
                </div>
            </div>

            {/* 运行控制工具栏 */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                backgroundColor: 'rgba(45, 45, 45, 0.95)',
                padding: '8px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 100
            }}>
                <button
                    onClick={handlePlay}
                    disabled={executionMode === 'running'}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: executionMode === 'running' ? '#2d2d2d' : '#4caf50',
                        border: 'none',
                        borderRadius: '4px',
                        color: executionMode === 'running' ? '#666' : '#fff',
                        cursor: executionMode === 'running' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="运行"
                >
                    <Play size={16} />
                    Play
                </button>
                <button
                    onClick={handlePause}
                    disabled={executionMode === 'idle'}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: executionMode === 'idle' ? '#2d2d2d' : '#ff9800',
                        border: 'none',
                        borderRadius: '4px',
                        color: executionMode === 'idle' ? '#666' : '#fff',
                        cursor: executionMode === 'idle' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="暂停/继续"
                >
                    {executionMode === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                    {executionMode === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button
                    onClick={handleStop}
                    disabled={executionMode === 'idle'}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: executionMode === 'idle' ? '#2d2d2d' : '#f44336',
                        border: 'none',
                        borderRadius: '4px',
                        color: executionMode === 'idle' ? '#666' : '#fff',
                        cursor: executionMode === 'idle' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="停止"
                >
                    <Square size={16} />
                    Stop
                </button>
                <button
                    onClick={handleStep}
                    disabled={executionMode !== 'idle' && executionMode !== 'paused'}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: (executionMode !== 'idle' && executionMode !== 'paused') ? '#2d2d2d' : '#2196f3',
                        border: 'none',
                        borderRadius: '4px',
                        color: (executionMode !== 'idle' && executionMode !== 'paused') ? '#666' : '#fff',
                        cursor: (executionMode !== 'idle' && executionMode !== 'paused') ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="步进"
                >
                    <SkipForward size={16} />
                    Step
                </button>
                <button
                    onClick={handleReset}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#9e9e9e',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="重置"
                >
                    <RotateCcw size={16} />
                    Reset
                </button>

                {/* 分隔符 */}
                <div style={{
                    width: '1px',
                    backgroundColor: '#666',
                    margin: '4px 0'
                }} />

                {/* 编辑按钮 */}
                <button
                    onClick={handleResetView}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#3c3c3c',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#cccccc',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="重置视图 (滚轮缩放, Alt+拖动平移)"
                >
                    <RotateCcw size={14} />
                    View
                </button>
                <button
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#3c3c3c',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#cccccc',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="清空画布"
                    onClick={() => {
                        if (confirm('确定要清空画布吗？')) {
                            setNodes([
                                {
                                    id: ROOT_NODE_ID,
                                    template: rootNodeTemplate,
                                    data: { nodeType: 'root' },
                                    position: { x: 400, y: 100 },
                                    children: []
                                }
                            ]);
                            setConnections([]);
                            setSelectedNodeId(null);
                        }
                    }}
                >
                    <Trash2 size={14} />
                    Clear
                </button>

                {/* 状态指示器 */}
                <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#1e1e1e',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#ccc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor:
                            executionMode === 'running' ? '#4caf50' :
                            executionMode === 'paused' ? '#ff9800' : '#666'
                    }} />
                    {executionMode === 'idle' ? 'Idle' :
                     executionMode === 'running' ? 'Running' :
                     executionMode === 'paused' ? 'Paused' : 'Step'}
                </div>
            </div>

            {/* 状态栏 */}
            <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                padding: '8px 15px',
                backgroundColor: 'rgba(45, 45, 45, 0.95)',
                borderTop: '1px solid #333',
                fontSize: '12px',
                color: '#999',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <div>节点数: {nodes.length}</div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {executionMode === 'running' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <RotateCcw size={14} />
                            Tick: {tickCount}
                        </div>
                    )}
                    <div>{selectedNodeId ? '已选择节点' : '未选择节点'}</div>
                </div>
            </div>
        </div>
    );
};

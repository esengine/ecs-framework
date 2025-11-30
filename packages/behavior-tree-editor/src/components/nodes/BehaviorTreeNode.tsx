import { React, Icons } from '@esengine/editor-runtime';
import type { LucideIcon } from '@esengine/editor-runtime';
import type { PropertyDefinition } from '@esengine/behavior-tree';

import { Node as BehaviorTreeNodeType } from '../../domain/models/Node';
import { Connection } from '../../domain/models/Connection';
import { ROOT_NODE_ID } from '../../domain/constants/RootNode';
import type { NodeExecutionStatus } from '../../stores';

import { BehaviorTreeExecutor } from '../../utils/BehaviorTreeExecutor';
import { BlackboardValue } from '../../domain/models/Blackboard';

const { TreePine, Database, AlertTriangle, AlertCircle } = Icons;

type BlackboardVariables = Record<string, BlackboardValue>;

interface BehaviorTreeNodeProps {
    node: BehaviorTreeNodeType;
    isSelected: boolean;
    isBeingDragged: boolean;
    dragDelta: { dx: number; dy: number };
    uncommittedNodeIds: Set<string>;
    blackboardVariables: BlackboardVariables;
    initialBlackboardVariables: BlackboardVariables;
    isExecuting: boolean;
    executionStatus?: NodeExecutionStatus;
    executionOrder?: number;
    connections: Connection[];
    nodes: BehaviorTreeNodeType[];
    executorRef: React.RefObject<BehaviorTreeExecutor | null>;
    iconMap: Record<string, LucideIcon>;
    draggingNodeId: string | null;
    onNodeClick: (e: React.MouseEvent, node: BehaviorTreeNodeType) => void;
    onContextMenu: (e: React.MouseEvent, node: BehaviorTreeNodeType) => void;
    onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onNodeMouseUpForConnection: (e: React.MouseEvent, nodeId: string) => void;
    onPortMouseDown: (e: React.MouseEvent, nodeId: string, propertyName?: string) => void;
    onPortMouseUp: (e: React.MouseEvent, nodeId: string, propertyName?: string) => void;
}

const BehaviorTreeNodeComponent: React.FC<BehaviorTreeNodeProps> = ({
    node,
    isSelected,
    isBeingDragged,
    dragDelta,
    uncommittedNodeIds,
    blackboardVariables,
    initialBlackboardVariables,
    isExecuting,
    executionStatus,
    executionOrder,
    connections,
    nodes,
    executorRef,
    iconMap,
    draggingNodeId,
    onNodeClick,
    onContextMenu,
    onNodeMouseDown,
    onNodeMouseUpForConnection,
    onPortMouseDown,
    onPortMouseUp
}) => {
    const isRoot = node.id === ROOT_NODE_ID;
    const isBlackboardVariable = node.data.nodeType === 'blackboard-variable';

    const posX = node.position.x + (isBeingDragged ? dragDelta.dx : 0);
    const posY = node.position.y + (isBeingDragged ? dragDelta.dy : 0);

    const isUncommitted = uncommittedNodeIds.has(node.id);
    const nodeClasses = [
        'bt-node',
        isSelected && 'selected',
        isRoot && 'root',
        isUncommitted && 'uncommitted',
        executionStatus && executionStatus !== 'idle' && executionStatus
    ].filter(Boolean).join(' ');

    return (
        <div
            key={node.id}
            data-node-id={node.id}
            className={nodeClasses}
            onClick={(e) => onNodeClick(e, node)}
            onContextMenu={(e) => onContextMenu(e, node)}
            onMouseDown={(e) => onNodeMouseDown(e, node.id)}
            onMouseUp={(e) => onNodeMouseUpForConnection(e, node.id)}
            onDragStart={(e) => e.preventDefault()}
            style={{
                left: posX,
                top: posY,
                transform: 'translate(-50%, -50%)',
                cursor: isRoot ? 'default' : (draggingNodeId === node.id ? 'grabbing' : 'grab'),
                transition: draggingNodeId === node.id ? 'none' : 'all 0.2s',
                zIndex: isRoot ? 50 : (draggingNodeId === node.id ? 100 : (isSelected ? 10 : 1))
            }}
        >
            {/* 执行顺序角标 - 使用绝对定位，不影响节点布局 */}
            {executionOrder !== undefined && (
                <div
                    className="bt-node-execution-badge"
                    style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        backgroundColor: '#2196f3',
                        color: '#fff',
                        borderRadius: '50%',
                        minWidth: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        padding: '0 6px',
                        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.5)',
                        border: '2px solid #1a1a1d',
                        zIndex: 10,
                        pointerEvents: 'none'
                    }}
                    title={`执行顺序: ${executionOrder}`}
                >
                    {executionOrder}
                </div>
            )}
            {isBlackboardVariable ? (
                (() => {
                    const varName = node.data.variableName as string;
                    const currentValue = blackboardVariables[varName];
                    const initialValue = initialBlackboardVariables[varName];
                    const isModified = isExecuting && JSON.stringify(currentValue) !== JSON.stringify(initialValue);

                    return (
                        <>
                            <div className="bt-node-header blackboard">
                                <Database size={16} className="bt-node-header-icon" />
                                <div className="bt-node-header-title">
                                    {varName || 'Variable'}
                                </div>
                                {isModified && (
                                    <span style={{
                                        fontSize: '9px',
                                        color: '#ffbb00',
                                        backgroundColor: 'rgba(255, 187, 0, 0.2)',
                                        padding: '2px 4px',
                                        borderRadius: '2px',
                                        marginLeft: '4px'
                                    }}>
                                        运行时
                                    </span>
                                )}
                            </div>
                            <div className="bt-node-body">
                                <div
                                    className="bt-node-blackboard-value"
                                    style={{
                                        backgroundColor: isModified ? 'rgba(255, 187, 0, 0.15)' : 'transparent',
                                        border: isModified ? '1px solid rgba(255, 187, 0, 0.3)' : 'none',
                                        borderRadius: '2px',
                                        padding: '2px 4px'
                                    }}
                                    title={isModified ? `初始值: ${JSON.stringify(initialValue)}\n当前值: ${JSON.stringify(currentValue)}` : undefined}
                                >
                                    {JSON.stringify(currentValue)}
                                </div>
                            </div>
                            <div
                                data-port="true"
                                data-node-id={node.id}
                                data-property="__value__"
                                data-port-type="variable-output"
                                onMouseDown={(e) => onPortMouseDown(e, node.id, '__value__')}
                                onMouseUp={(e) => onPortMouseUp(e, node.id, '__value__')}
                                className="bt-node-port bt-node-port-variable-output"
                                title="Output"
                            />
                        </>
                    );
                })()
            ) : (
                <>
                    <div className={`bt-node-header ${isRoot ? 'root' : (node.template.type || 'action')}`}>
                        {isRoot ? (
                            <TreePine size={16} className="bt-node-header-icon" />
                        ) : (
                            node.template.icon && (() => {
                                const IconComponent = iconMap[node.template.icon];
                                return IconComponent ? (
                                    <IconComponent size={16} className="bt-node-header-icon" />
                                ) : (
                                    <span className="bt-node-header-icon">{node.template.icon}</span>
                                );
                            })()
                        )}
                        <div className="bt-node-header-title">
                            <div>{isRoot ? 'ROOT' : node.template.displayName}</div>
                            <div className="bt-node-id" title={node.id}>
                                #{node.id}
                            </div>
                        </div>
                        {!isRoot && node.template.className && executorRef.current && !executorRef.current.hasExecutor(node.template.className) && (
                            <div
                                className="bt-node-missing-executor-warning"
                                style={{
                                    marginLeft: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'help',
                                    pointerEvents: 'auto',
                                    position: 'relative'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <AlertCircle
                                    size={14}
                                    style={{
                                        color: '#f44336',
                                        flexShrink: 0
                                    }}
                                />
                                <div className="bt-node-missing-executor-tooltip">
                                    缺失执行器：找不到节点对应的执行器 "{node.template.className}"
                                </div>
                            </div>
                        )}
                        {isUncommitted && (
                            <div
                                className="bt-node-uncommitted-warning"
                                style={{
                                    marginLeft: (!isRoot && node.template.className && executorRef.current && !executorRef.current.hasExecutor(node.template.className)) ? '4px' : 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'help',
                                    pointerEvents: 'auto',
                                    position: 'relative'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <AlertTriangle
                                    size={14}
                                    style={{
                                        color: '#ff5722',
                                        flexShrink: 0
                                    }}
                                />
                                <div className="bt-node-uncommitted-tooltip">
                                    未生效节点：运行时添加的节点，需重新运行才能生效
                                </div>
                            </div>
                        )}
                        {!isRoot && !isUncommitted && node.template.type === 'composite' &&
                            (node.template.requiresChildren === undefined || node.template.requiresChildren === true) &&
                            !nodes.some((n) =>
                                connections.some((c) => c.from === node.id && c.to === n.id)
                            ) && (
                            <div
                                className="bt-node-empty-warning-container"
                                style={{
                                    marginLeft: ((!isRoot && node.template.className && executorRef.current && !executorRef.current.hasExecutor(node.template.className)) || isUncommitted) ? '4px' : 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'help',
                                    pointerEvents: 'auto',
                                    position: 'relative'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <AlertTriangle
                                    size={14}
                                    style={{
                                        color: '#ff9800',
                                        flexShrink: 0
                                    }}
                                />
                                <div className="bt-node-empty-warning-tooltip">
                                        空节点：没有子节点，执行时会直接跳过
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bt-node-body">
                        {!isRoot && (
                            <div className="bt-node-category">
                                {node.template.category}
                            </div>
                        )}

                        {node.template.properties.length > 0 && (
                            <div className="bt-node-properties">
                                {node.template.properties.map((prop: PropertyDefinition, idx: number) => {
                                    const hasConnection = connections.some(
                                        (conn: Connection) => conn.toProperty === prop.name && conn.to === node.id
                                    );
                                    const propValue = node.data[prop.name];

                                    return (
                                        <div key={idx} className="bt-node-property">
                                            <div
                                                data-port="true"
                                                data-node-id={node.id}
                                                data-property={prop.name}
                                                data-port-type="property-input"
                                                onMouseDown={(e) => onPortMouseDown(e, node.id, prop.name)}
                                                onMouseUp={(e) => onPortMouseUp(e, node.id, prop.name)}
                                                className={`bt-node-port bt-node-port-property ${hasConnection ? 'connected' : ''}`}
                                                title={prop.description || prop.name}
                                            />
                                            <span
                                                className="bt-node-property-label"
                                                title={prop.description}
                                            >
                                                {prop.name}:
                                            </span>
                                            {propValue !== undefined && (
                                                <span className="bt-node-property-value">
                                                    {String(propValue)}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {!isRoot && (
                        <div
                            data-port="true"
                            data-node-id={node.id}
                            data-port-type="node-input"
                            onMouseDown={(e) => onPortMouseDown(e, node.id)}
                            onMouseUp={(e) => onPortMouseUp(e, node.id)}
                            className="bt-node-port bt-node-port-input"
                            title="Input"
                        />
                    )}

                    {(isRoot || node.template.type === 'composite' || node.template.type === 'decorator') &&
                        (node.template.requiresChildren === undefined || node.template.requiresChildren === true) && (
                        <div
                            data-port="true"
                            data-node-id={node.id}
                            data-port-type="node-output"
                            onMouseDown={(e) => onPortMouseDown(e, node.id)}
                            onMouseUp={(e) => onPortMouseUp(e, node.id)}
                            className="bt-node-port bt-node-port-output"
                            title="Output"
                        />
                    )}
                </>
            )}
        </div>
    );
};

/**
 * 使用 React.memo 优化节点组件性能
 * 只在关键 props 变化时重新渲染
 */
export const BehaviorTreeNode = React.memo(BehaviorTreeNodeComponent, (prevProps, nextProps) => {
    // 如果节点本身变化，需要重新渲染
    if (prevProps.node.id !== nextProps.node.id ||
        prevProps.node.position.x !== nextProps.node.position.x ||
        prevProps.node.position.y !== nextProps.node.position.y ||
        prevProps.node.template.className !== nextProps.node.template.className) {
        return false;
    }

    if (prevProps.isSelected !== nextProps.isSelected ||
        prevProps.isBeingDragged !== nextProps.isBeingDragged ||
        prevProps.executionStatus !== nextProps.executionStatus ||
        prevProps.executionOrder !== nextProps.executionOrder ||
        prevProps.draggingNodeId !== nextProps.draggingNodeId) {
        return false;
    }

    // 如果正在被拖拽，且 dragDelta 变化，需要重新渲染
    if (nextProps.isBeingDragged &&
        (prevProps.dragDelta.dx !== nextProps.dragDelta.dx ||
         prevProps.dragDelta.dy !== nextProps.dragDelta.dy)) {
        return false;
    }

    // 如果执行状态变化，需要重新渲染
    if (prevProps.isExecuting !== nextProps.isExecuting) {
        return false;
    }

    // 检查 uncommittedNodeIds 中是否包含当前节点
    const prevUncommitted = prevProps.uncommittedNodeIds.has(nextProps.node.id);
    const nextUncommitted = nextProps.uncommittedNodeIds.has(nextProps.node.id);
    if (prevUncommitted !== nextUncommitted) {
        return false;
    }

    // 节点数据变化时需要重新渲染
    if (JSON.stringify(prevProps.node.data) !== JSON.stringify(nextProps.node.data)) {
        return false;
    }

    // 其他情况不重新渲染
    return true;
});

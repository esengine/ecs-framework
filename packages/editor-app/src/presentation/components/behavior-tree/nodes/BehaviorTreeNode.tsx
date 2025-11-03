import React from 'react';
import {
    TreePine,
    Database,
    AlertTriangle,
    AlertCircle,
    LucideIcon
} from 'lucide-react';
import { PropertyDefinition } from '@esengine/behavior-tree';
import { BehaviorTreeNode as BehaviorTreeNodeType, Connection, ROOT_NODE_ID } from '../../../../stores/behaviorTreeStore';
import { BehaviorTreeExecutor } from '../../../../utils/BehaviorTreeExecutor';
import { BlackboardValue } from '../../../../domain/models/Blackboard';

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

export const BehaviorTreeNode: React.FC<BehaviorTreeNodeProps> = ({
    node,
    isSelected,
    isBeingDragged,
    dragDelta,
    uncommittedNodeIds,
    blackboardVariables,
    initialBlackboardVariables,
    isExecuting,
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
        isUncommitted && 'uncommitted'
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
            style={{
                left: posX,
                top: posY,
                transform: 'translate(-50%, -50%)',
                cursor: isRoot ? 'default' : (draggingNodeId === node.id ? 'grabbing' : 'grab'),
                transition: draggingNodeId === node.id ? 'none' : 'all 0.2s',
                zIndex: isRoot ? 50 : (draggingNodeId === node.id ? 100 : (isSelected ? 10 : 1))
            }}
        >
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
                                    marginLeft: !isRoot && node.template.className && executorRef.current && !executorRef.current.hasExecutor(node.template.className) ? '4px' : 'auto',
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
                                        marginLeft: isUncommitted ? '4px' : 'auto',
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

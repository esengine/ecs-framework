import { React, useMemo, Icons } from '@esengine/editor-runtime';
import type { LucideIcon } from '@esengine/editor-runtime';

import { NodeViewData } from '../../types';

const LucideIcons = Icons;

/**
 * 图标映射
 */
const iconMap: Record<string, LucideIcon> = {
    TreePine: LucideIcons.TreePine,
    GitBranch: LucideIcons.GitBranch,
    Shuffle: LucideIcons.Shuffle,
    Repeat: LucideIcons.Repeat,
    RotateCcw: LucideIcons.RotateCcw,
    FlipHorizontal: LucideIcons.FlipHorizontal,
    CheckCircle: LucideIcons.CheckCircle,
    XCircle: LucideIcons.XCircle,
    Play: LucideIcons.Play,
    Pause: LucideIcons.Pause,
    Square: LucideIcons.Square,
    Circle: LucideIcons.Circle,
    Diamond: LucideIcons.Diamond,
    Box: LucideIcons.Box,
    Flag: LucideIcons.Flag,
    Target: LucideIcons.Target
};

/**
 * 节点渲染器属性
 */
interface BehaviorTreeNodeRendererProps {
    /**
     * 节点视图数据
     */
    nodeData: NodeViewData;

    /**
     * 节点点击事件
     */
    onClick?: (e: React.MouseEvent, nodeId: string) => void;

    /**
     * 节点双击事件
     */
    onDoubleClick?: (e: React.MouseEvent, nodeId: string) => void;

    /**
     * 节点右键事件
     */
    onContextMenu?: (e: React.MouseEvent, nodeId: string) => void;

    /**
     * 鼠标按下事件
     */
    onMouseDown?: (e: React.MouseEvent, nodeId: string) => void;
}

/**
 * 行为树节点渲染器
 * 负责单个节点的渲染
 */
export const BehaviorTreeNodeRenderer: React.FC<BehaviorTreeNodeRendererProps> = ({
    nodeData,
    onClick,
    onDoubleClick,
    onContextMenu,
    onMouseDown
}) => {
    const { node, isSelected, isDragging, executionStatus } = nodeData;
    const { template, position } = node;

    const IconComponent = iconMap[template.icon || 'Box'] || LucideIcons.Box;

    const nodeStyle = useMemo(() => {
        let borderColor = template.color || '#4a9eff';
        const backgroundColor = '#2a2a2a';
        let boxShadow = 'none';

        if (isSelected) {
            boxShadow = `0 0 0 2px ${borderColor}`;
        }

        if (executionStatus === 'running') {
            borderColor = '#ffa500';
            boxShadow = `0 0 10px ${borderColor}`;
        } else if (executionStatus === 'success') {
            borderColor = '#00ff00';
        } else if (executionStatus === 'failure') {
            borderColor = '#ff0000';
        }

        return {
            position: 'absolute' as const,
            left: position.x,
            top: position.y,
            minWidth: '180px',
            padding: '12px',
            backgroundColor,
            borderRadius: '8px',
            border: `2px solid ${borderColor}`,
            boxShadow,
            cursor: 'pointer',
            userSelect: 'none' as const,
            transition: 'box-shadow 0.2s',
            opacity: isDragging ? 0.7 : 1
        };
    }, [template.color, position, isSelected, isDragging, executionStatus]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.(e, node.id);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDoubleClick?.(e, node.id);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        onContextMenu?.(e, node.id);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMouseDown?.(e, node.id);
    };

    return (
        <div
            className="behavior-tree-node"
            style={nodeStyle}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onMouseDown={handleMouseDown}
            data-node-id={node.id}
        >
            {/* 节点头部 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
            }}>
                <IconComponent size={20} color={template.color || '#4a9eff'} />
                <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    flex: 1
                }}>
                    {template.displayName}
                </div>
            </div>

            {/* 节点类型 */}
            {template.category && (
                <div style={{
                    fontSize: '11px',
                    color: '#888888',
                    marginBottom: '4px'
                }}>
                    {template.category}
                </div>
            )}

            {/* 节点描述 */}
            {template.description && (
                <div style={{
                    fontSize: '12px',
                    color: '#cccccc',
                    marginTop: '8px',
                    lineHeight: '1.4'
                }}>
                    {template.description}
                </div>
            )}

            {/* 输入连接点 */}
            <div
                className="node-input-pin"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '-6px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: template.color || '#4a9eff',
                    border: '2px solid #1a1a1a',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer'
                }}
                data-pin-type="input"
                data-node-id={node.id}
            />

            {/* 输出连接点 */}
            <div
                className="node-output-pin"
                style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-6px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: template.color || '#4a9eff',
                    border: '2px solid #1a1a1a',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer'
                }}
                data-pin-type="output"
                data-node-id={node.id}
            />
        </div>
    );
};

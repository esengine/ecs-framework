/**
 * 行为树编辑器常量定义
 */

// 根节点 ID
export const ROOT_NODE_ID = 'root';

// 节点类型
export enum NodeType {
    Root = 'root',
    Sequence = 'sequence',
    Selector = 'selector',
    Parallel = 'parallel',
    Decorator = 'decorator',
    Action = 'action',
    Condition = 'condition'
}

// 端口类型
export enum PortType {
    Input = 'input',
    Output = 'output'
}

// 编辑器默认配置
export const DEFAULT_EDITOR_CONFIG = {
    showGrid: true,
    gridSize: 20,
    snapToGrid: true,
    canvasBackground: '#1a1a1a',
    connectionColor: '#4a9eff',
    nodeSpacing: { x: 200, y: 100 },
    nodeWidth: 160,
    nodeHeight: 60,
    portSize: 8
};

// 颜色配置
export const NODE_COLORS = {
    [NodeType.Root]: '#666',
    [NodeType.Sequence]: '#4a9eff',
    [NodeType.Selector]: '#ffb84d',
    [NodeType.Parallel]: '#b84dff',
    [NodeType.Decorator]: '#4dffb8',
    [NodeType.Action]: '#ff4d4d',
    [NodeType.Condition]: '#4dff9e'
};

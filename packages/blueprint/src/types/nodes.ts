/**
 * Blueprint Node Types
 * 蓝图节点类型
 */

import { BlueprintPinDefinition } from './pins';

/**
 * Node category for visual styling and organization
 * 节点类别，用于视觉样式和组织
 */
export type BlueprintNodeCategory =
    | 'event'     // Event nodes - red (事件节点 - 红色)
    | 'flow'      // Flow control - gray (流程控制 - 灰色)
    | 'entity'    // Entity operations - blue (实体操作 - 蓝色)
    | 'component' // Component access - cyan (组件访问 - 青色)
    | 'math'      // Math operations - green (数学运算 - 绿色)
    | 'logic'     // Logic operations - red (逻辑运算 - 红色)
    | 'variable'  // Variable access - purple (变量访问 - 紫色)
    | 'input'     // Input handling - orange (输入处理 - 橙色)
    | 'physics'   // Physics - yellow (物理 - 黄色)
    | 'audio'     // Audio - pink (音频 - 粉色)
    | 'time'      // Time utilities - cyan (时间工具 - 青色)
    | 'debug'     // Debug utilities - gray (调试工具 - 灰色)
    | 'custom';   // Custom nodes (自定义节点)

/**
 * Node template definition - describes a type of node
 * 节点模板定义 - 描述一种节点类型
 */
export interface BlueprintNodeTemplate {
    /** Unique type identifier (唯一类型标识符) */
    type: string;

    /** Display title (显示标题) */
    title: string;

    /** Node category (节点类别) */
    category: BlueprintNodeCategory;

    /** Optional subtitle (可选副标题) */
    subtitle?: string;

    /** Icon name (图标名称) */
    icon?: string;

    /** Description for documentation (文档描述) */
    description?: string;

    /** Search keywords (搜索关键词) */
    keywords?: string[];

    /** Menu path for node palette (节点面板的菜单路径) */
    menuPath?: string[];

    /** Input pin definitions (输入引脚定义) */
    inputs: BlueprintPinDefinition[];

    /** Output pin definitions (输出引脚定义) */
    outputs: BlueprintPinDefinition[];

    /** Whether this node is pure (no exec pins) (是否是纯节点，无执行引脚) */
    isPure?: boolean;

    /** Whether this node can be collapsed (是否可折叠) */
    collapsible?: boolean;

    /** Custom header color override (自定义头部颜色) */
    headerColor?: string;

    /** Node color for visual distinction (节点颜色用于视觉区分) */
    color?: string;
}

/**
 * Node instance in a blueprint graph
 * 蓝图图中的节点实例
 */
export interface BlueprintNode {
    /** Unique instance ID (唯一实例ID) */
    id: string;

    /** Template type reference (模板类型引用) */
    type: string;

    /** Position in graph (图中位置) */
    position: { x: number; y: number };

    /** Custom data for this instance (此实例的自定义数据) */
    data: Record<string, unknown>;

    /** Comment/note for this node (此节点的注释) */
    comment?: string;
}

/**
 * Connection between two pins
 * 两个引脚之间的连接
 */
export interface BlueprintConnection {
    /** Unique connection ID (唯一连接ID) */
    id: string;

    /** Source node ID (源节点ID) */
    fromNodeId: string;

    /** Source pin name (源引脚名称) */
    fromPin: string;

    /** Target node ID (目标节点ID) */
    toNodeId: string;

    /** Target pin name (目标引脚名称) */
    toPin: string;
}

/**
 * Gets the header color for a node category
 * 获取节点类别的头部颜色
 */
export function getNodeCategoryColor(category: BlueprintNodeCategory): string {
    const colors: Record<BlueprintNodeCategory, string> = {
        event: '#8b1e1e',
        flow: '#4a4a4a',
        entity: '#1e5a8b',
        component: '#1e8b8b',
        math: '#1e8b5a',
        logic: '#8b1e5a',
        variable: '#5a1e8b',
        input: '#8b5a1e',
        physics: '#8b8b1e',
        audio: '#8b1e6b',
        time: '#1e6b8b',
        debug: '#5a5a5a',
        custom: '#4a4a4a'
    };
    return colors[category] ?? colors.custom;
}

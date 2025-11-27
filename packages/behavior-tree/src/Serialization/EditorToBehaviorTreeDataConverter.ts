import { BehaviorTreeData, BehaviorNodeData } from '../execution/BehaviorTreeData';
import { NodeType, AbortType } from '../Types/TaskStatus';

/**
 * 编辑器节点数据接口
 */
interface EditorNode {
    id: string;
    template: {
        type: string;
        className: string;
        displayName?: string;
    };
    data: Record<string, any>;
    children?: string[];
}

/**
 * 编辑器行为树数据接口
 */
interface EditorBehaviorTreeData {
    version?: string;
    metadata?: {
        name: string;
        description?: string;
        createdAt?: string;
        modifiedAt?: string;
    };
    nodes: EditorNode[];
    blackboard?: Record<string, any>;
}

/**
 * 编辑器格式到运行时格式的转换器
 *
 * 负责将编辑器的 JSON 格式（包含UI信息）转换为运行时的 BehaviorTreeData 格式
 */
export class EditorToBehaviorTreeDataConverter {
    /**
     * 将编辑器 JSON 字符串转换为运行时 BehaviorTreeData
     */
    static fromEditorJSON(json: string): BehaviorTreeData {
        const editorData: EditorBehaviorTreeData = JSON.parse(json);
        return this.convert(editorData);
    }

    /**
     * 将编辑器数据对象转换为运行时 BehaviorTreeData
     */
    static convert(editorData: EditorBehaviorTreeData): BehaviorTreeData {
        // 查找根节点
        const rootNode = editorData.nodes.find((n) =>
            n.template.type === 'root' || n.data['nodeType'] === 'root'
        );

        if (!rootNode) {
            throw new Error('Behavior tree must have a root node');
        }

        // 转换所有节点
        const nodesMap = new Map<string, BehaviorNodeData>();
        for (const editorNode of editorData.nodes) {
            const behaviorNodeData = this.convertNode(editorNode);
            nodesMap.set(behaviorNodeData.id, behaviorNodeData);
        }

        // 转换黑板变量
        const blackboardVariables = editorData.blackboard
            ? new Map(Object.entries(editorData.blackboard))
            : new Map();

        return {
            id: this.generateTreeId(editorData),
            name: editorData.metadata?.name || 'Untitled',
            rootNodeId: rootNode.id,
            nodes: nodesMap,
            blackboardVariables
        };
    }

    /**
     * 转换单个节点
     */
    private static convertNode(editorNode: EditorNode): BehaviorNodeData {
        const nodeType = this.mapNodeType(editorNode.template.type);
        const config = this.extractConfig(editorNode.data);
        const bindings = this.extractBindings(editorNode.data);
        const abortType = this.extractAbortType(editorNode.data);

        return {
            id: editorNode.id,
            name: editorNode.template.displayName || editorNode.template.className,
            nodeType,
            implementationType: editorNode.template.className,
            children: editorNode.children || [],
            config,
            ...(Object.keys(bindings).length > 0 && { bindings }),
            ...(abortType && { abortType })
        };
    }

    /**
     * 映射节点类型
     */
    private static mapNodeType(type: string): NodeType {
        switch (type.toLowerCase()) {
            case 'root':
                return NodeType.Root;
            case 'composite':
                return NodeType.Composite;
            case 'decorator':
                return NodeType.Decorator;
            case 'action':
                return NodeType.Action;
            case 'condition':
                return NodeType.Condition;
            default:
                throw new Error(`Unknown node type: ${type}`);
        }
    }

    /**
     * 提取节点配置（过滤掉内部字段和绑定字段）
     */
    private static extractConfig(data: Record<string, any>): Record<string, any> {
        const config: Record<string, any> = {};
        const internalFields = new Set(['nodeType', 'abortType']);

        for (const [key, value] of Object.entries(data)) {
            // 跳过内部字段
            if (internalFields.has(key)) {
                continue;
            }

            // 跳过黑板绑定字段（它们会被提取到 bindings 中）
            if (this.isBinding(value)) {
                continue;
            }

            config[key] = value;
        }

        return config;
    }

    /**
     * 提取黑板变量绑定
     */
    private static extractBindings(data: Record<string, any>): Record<string, string> {
        const bindings: Record<string, string> = {};

        for (const [key, value] of Object.entries(data)) {
            if (this.isBinding(value)) {
                bindings[key] = this.extractBindingKey(value);
            }
        }

        return bindings;
    }

    /**
     * 判断是否为黑板绑定
     */
    private static isBinding(value: any): boolean {
        if (typeof value === 'object' && value !== null) {
            return value._isBlackboardBinding === true ||
                   value.type === 'blackboard' ||
                   (value.blackboardKey !== undefined);
        }
        return false;
    }

    /**
     * 提取黑板绑定的键名
     */
    private static extractBindingKey(binding: any): string {
        return binding.blackboardKey || binding.key || binding.value || '';
    }

    /**
     * 提取中止类型（条件装饰器使用）
     */
    private static extractAbortType(data: Record<string, any>): AbortType | undefined {
        if (!data['abortType']) {
            return undefined;
        }

        const abortTypeStr = String(data['abortType']).toLowerCase();
        switch (abortTypeStr) {
            case 'none':
                return AbortType.None;
            case 'self':
                return AbortType.Self;
            case 'lowerpriority':
            case 'lower_priority':
                return AbortType.LowerPriority;
            case 'both':
                return AbortType.Both;
            default:
                return AbortType.None;
        }
    }

    /**
     * 生成行为树ID
     */
    private static generateTreeId(editorData: EditorBehaviorTreeData): string {
        if (editorData.metadata?.name) {
            // 将名称转换为合法ID（移除特殊字符）
            return editorData.metadata.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        }
        return `tree_${Date.now()}`;
    }

    /**
     * 将运行时格式转换回编辑器格式（用于双向转换）
     */
    static toEditorJSON(treeData: BehaviorTreeData): string {
        const editorData = this.convertToEditor(treeData);
        return JSON.stringify(editorData, null, 2);
    }

    /**
     * 将运行时 BehaviorTreeData 转换为编辑器格式
     */
    static convertToEditor(treeData: BehaviorTreeData): EditorBehaviorTreeData {
        const nodes: EditorNode[] = [];

        for (const [_id, nodeData] of treeData.nodes) {
            nodes.push(this.convertNodeToEditor(nodeData));
        }

        const blackboard = treeData.blackboardVariables
            ? Object.fromEntries(treeData.blackboardVariables)
            : {};

        return {
            version: '1.0.0',
            metadata: {
                name: treeData.name,
                description: '',
                modifiedAt: new Date().toISOString()
            },
            nodes,
            blackboard
        };
    }

    /**
     * 将运行时节点转换为编辑器节点
     */
    private static convertNodeToEditor(nodeData: BehaviorNodeData): EditorNode {
        const data: Record<string, any> = { ...nodeData.config };

        // 添加绑定回数据对象
        if (nodeData.bindings) {
            for (const [key, blackboardKey] of Object.entries(nodeData.bindings)) {
                data[key] = {
                    _isBlackboardBinding: true,
                    blackboardKey
                };
            }
        }

        // 添加中止类型
        if (nodeData.abortType !== undefined) {
            data['abortType'] = nodeData.abortType;
        }

        // 获取节点类型字符串
        let typeStr: string;
        if (typeof nodeData.nodeType === 'string') {
            typeStr = nodeData.nodeType;
        } else {
            typeStr = 'action'; // 默认值
        }

        const result: EditorNode = {
            id: nodeData.id,
            template: {
                type: typeStr,
                className: nodeData.implementationType,
                displayName: nodeData.name
            },
            data
        };

        if (nodeData.children && nodeData.children.length > 0) {
            result.children = nodeData.children;
        }

        return result;
    }
}

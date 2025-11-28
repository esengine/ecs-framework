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
 * 编辑器连接数据接口
 */
interface EditorConnection {
    from: string;
    to: string;
    connectionType: 'node' | 'property';
    fromProperty?: string;
    toProperty?: string;
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
    connections?: EditorConnection[];
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

        // 构建属性绑定映射：nodeId -> { propertyName -> blackboardKey }
        const propertyBindingsMap = this.buildPropertyBindingsMap(editorData);

        // 转换所有节点（过滤掉不可执行的节点，如黑板变量节点）
        const nodesMap = new Map<string, BehaviorNodeData>();
        for (const editorNode of editorData.nodes) {
            // 跳过黑板变量节点，它们只用于编辑器的可视化绑定
            if (this.isNonExecutableNode(editorNode)) {
                continue;
            }
            const propertyBindings = propertyBindingsMap.get(editorNode.id);
            const behaviorNodeData = this.convertNode(editorNode, propertyBindings);
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
     * 从连接数据构建属性绑定映射
     * 处理 connectionType === 'property' 的连接，将黑板变量节点连接到目标节点的属性
     */
    private static buildPropertyBindingsMap(
        editorData: EditorBehaviorTreeData
    ): Map<string, Record<string, string>> {
        const bindingsMap = new Map<string, Record<string, string>>();

        if (!editorData.connections) {
            return bindingsMap;
        }

        // 构建节点 ID 到变量名的映射（用于黑板变量节点）
        const nodeToVariableMap = new Map<string, string>();
        for (const node of editorData.nodes) {
            if (node.data['nodeType'] === 'blackboard-variable' && node.data['variableName']) {
                nodeToVariableMap.set(node.id, node.data['variableName']);
            }
        }

        // 处理属性连接
        for (const conn of editorData.connections) {
            if (conn.connectionType === 'property' && conn.toProperty) {
                const variableName = nodeToVariableMap.get(conn.from);
                if (variableName) {
                    // 获取或创建目标节点的绑定记录
                    let bindings = bindingsMap.get(conn.to);
                    if (!bindings) {
                        bindings = {};
                        bindingsMap.set(conn.to, bindings);
                    }
                    // 将属性绑定到黑板变量
                    bindings[conn.toProperty] = variableName;
                }
            }
        }

        return bindingsMap;
    }

    /**
     * 转换单个节点
     * @param editorNode 编辑器节点数据
     * @param propertyBindings 从连接中提取的属性绑定（可选）
     */
    private static convertNode(
        editorNode: EditorNode,
        propertyBindings?: Record<string, string>
    ): BehaviorNodeData {
        const nodeType = this.mapNodeType(editorNode.template.type);
        const config = this.extractConfig(editorNode.data);
        // 从节点数据中提取绑定
        const dataBindings = this.extractBindings(editorNode.data);
        // 合并连接绑定和数据绑定（连接绑定优先）
        const bindings = { ...dataBindings, ...propertyBindings };
        const abortType = this.extractAbortType(editorNode.data);

        // 获取 implementationType：优先从 template.className，其次从 data 中的类型字段
        let implementationType: string | undefined = editorNode.template.className;
        if (!implementationType) {
            // 尝试从 data 中提取类型
            implementationType = this.extractImplementationType(editorNode.data, nodeType);
        }

        if (!implementationType) {
            console.warn(`[EditorToBehaviorTreeDataConverter] Node ${editorNode.id} has no implementationType, using fallback`);
            // 根据节点类型使用默认实现
            implementationType = this.getDefaultImplementationType(nodeType);
        }

        return {
            id: editorNode.id,
            name: editorNode.template.displayName || editorNode.template.className || implementationType,
            nodeType,
            implementationType,
            children: editorNode.children || [],
            config,
            ...(Object.keys(bindings).length > 0 && { bindings }),
            ...(abortType && { abortType })
        };
    }

    /**
     * 检查是否为不可执行的节点（如黑板变量节点）
     * 这些节点只在编辑器中使用，不参与运行时执行
     */
    private static isNonExecutableNode(editorNode: EditorNode): boolean {
        const nodeType = editorNode.data['nodeType'];
        // 黑板变量节点不需要执行，只用于可视化绑定
        return nodeType === 'blackboard-variable';
    }

    /**
     * 从节点数据中提取实现类型
     *
     * 优先级：
     * 1. template.className（标准方式）
     * 2. data 中的类型字段（compositeType, actionType 等）
     * 3. 特殊节点类型的默认值（如 Root）
     */
    private static extractImplementationType(data: Record<string, any>, nodeType: NodeType): string | undefined {
        // 节点类型到数据字段的映射
        const typeFieldMap: Record<NodeType, string> = {
            [NodeType.Composite]: 'compositeType',
            [NodeType.Decorator]: 'decoratorType',
            [NodeType.Action]: 'actionType',
            [NodeType.Condition]: 'conditionType',
            [NodeType.Root]: '', // Root 没有对应的数据字段
        };

        const field = typeFieldMap[nodeType];
        if (field && data[field]) {
            return data[field];
        }

        // Root 节点的特殊处理
        if (nodeType === NodeType.Root) {
            return 'Root';
        }

        return undefined;
    }

    /**
     * 获取节点类型的默认实现
     * 当无法确定具体实现类型时使用
     */
    private static getDefaultImplementationType(nodeType: NodeType): string {
        // 节点类型到默认实现的映射
        const defaultImplementations: Record<NodeType, string> = {
            [NodeType.Root]: 'Root',
            [NodeType.Composite]: 'Sequence',
            [NodeType.Decorator]: 'Inverter',
            [NodeType.Action]: 'Wait',
            [NodeType.Condition]: 'AlwaysTrue',
        };

        return defaultImplementations[nodeType] || 'Unknown';
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

import { createLogger } from '@esengine/ecs-framework';
import type { BehaviorTreeAsset, AssetMetadata, BehaviorTreeNodeData, BlackboardVariableDefinition, PropertyBinding } from './BehaviorTreeAsset';
import { NodeType, BlackboardValueType } from '../Types/TaskStatus';

const logger = createLogger('EditorFormatConverter');

/**
 * 编辑器节点格式
 */
export interface EditorNodeTemplate {
    displayName: string;
    category: string;
    type: NodeType;
    className?: string;
    [key: string]: any;
}

export interface EditorNodeData {
    nodeType?: string;
    className?: string;
    variableName?: string;
    name?: string;
    [key: string]: any;
}

export interface EditorNode {
    id: string;
    template: EditorNodeTemplate;
    data: EditorNodeData;
    position: { x: number; y: number };
    children: string[];
}

/**
 * 编辑器连接格式
 */
export interface EditorConnection {
    from: string;
    to: string;
    fromProperty?: string;
    toProperty?: string;
    connectionType: 'node' | 'property';
}

/**
 * 编辑器格式
 */
export interface EditorFormat {
    version?: string;
    metadata?: {
        name: string;
        description?: string;
        createdAt?: string;
        modifiedAt?: string;
    };
    nodes: EditorNode[];
    connections: EditorConnection[];
    blackboard: Record<string, any>;
    canvasState?: {
        offset: { x: number; y: number };
        scale: number;
    };
}

/**
 * 编辑器格式转换器
 *
 * 将编辑器格式转换为运行时资产格式
 */
export class EditorFormatConverter {
    /**
     * 转换编辑器格式为资产格式
     *
     * @param editorData 编辑器数据
     * @param metadata 可选的元数据覆盖
     * @returns 行为树资产
     */
    static toAsset(editorData: EditorFormat, metadata?: Partial<AssetMetadata>): BehaviorTreeAsset {
        logger.info('开始转换编辑器格式到资产格式');

        const rootNode = this.findRootNode(editorData.nodes);
        if (!rootNode) {
            throw new Error('未找到根节点');
        }

        const assetMetadata: AssetMetadata = {
            name: metadata?.name || editorData.metadata?.name || 'Untitled Behavior Tree',
            version: metadata?.version || editorData.version || '1.0.0'
        };

        const description = metadata?.description || editorData.metadata?.description;
        if (description) {
            assetMetadata.description = description;
        }

        const createdAt = metadata?.createdAt || editorData.metadata?.createdAt;
        if (createdAt) {
            assetMetadata.createdAt = createdAt;
        }

        const modifiedAt = metadata?.modifiedAt || new Date().toISOString();
        if (modifiedAt) {
            assetMetadata.modifiedAt = modifiedAt;
        }

        const nodes = this.convertNodes(editorData.nodes);

        const blackboard = this.convertBlackboard(editorData.blackboard);

        const propertyBindings = this.convertPropertyBindings(
            editorData.connections,
            editorData.nodes,
            blackboard
        );

        const asset: BehaviorTreeAsset = {
            version: '1.0.0',
            metadata: assetMetadata,
            rootNodeId: rootNode.id,
            nodes,
            blackboard
        };

        if (propertyBindings.length > 0) {
            asset.propertyBindings = propertyBindings;
        }

        logger.info(`转换完成: ${nodes.length}个节点, ${blackboard.length}个黑板变量, ${propertyBindings.length}个属性绑定`);

        return asset;
    }

    /**
     * 查找根节点
     */
    private static findRootNode(nodes: EditorNode[]): EditorNode | null {
        return nodes.find((node) =>
            node.template.category === '根节点' ||
            node.data.nodeType === 'root'
        ) || null;
    }

    /**
     * 转换节点列表
     */
    private static convertNodes(editorNodes: EditorNode[]): BehaviorTreeNodeData[] {
        return editorNodes.map((node) => this.convertNode(node));
    }

    /**
     * 转换单个节点
     */
    private static convertNode(editorNode: EditorNode): BehaviorTreeNodeData {
        const data = { ...editorNode.data };

        delete data.nodeType;

        if (editorNode.template.className) {
            data.className = editorNode.template.className;
        }

        return {
            id: editorNode.id,
            name: editorNode.template.displayName || editorNode.data.name || 'Node',
            nodeType: editorNode.template.type,
            data,
            children: editorNode.children || []
        };
    }

    /**
     * 转换黑板变量
     */
    private static convertBlackboard(blackboard: Record<string, any>): BlackboardVariableDefinition[] {
        const variables: BlackboardVariableDefinition[] = [];

        for (const [name, value] of Object.entries(blackboard)) {
            const type = this.inferBlackboardType(value);

            variables.push({
                name,
                type,
                defaultValue: value
            });
        }

        return variables;
    }

    /**
     * 推断黑板变量类型
     */
    private static inferBlackboardType(value: any): BlackboardValueType {
        if (typeof value === 'number') {
            return BlackboardValueType.Number;
        } else if (typeof value === 'string') {
            return BlackboardValueType.String;
        } else if (typeof value === 'boolean') {
            return BlackboardValueType.Boolean;
        } else {
            return BlackboardValueType.Object;
        }
    }

    /**
     * 转换属性绑定
     */
    private static convertPropertyBindings(
        connections: EditorConnection[],
        nodes: EditorNode[],
        blackboard: BlackboardVariableDefinition[]
    ): PropertyBinding[] {
        const bindings: PropertyBinding[] = [];
        const blackboardVarNames = new Set(blackboard.map((v) => v.name));

        const propertyConnections = connections.filter((conn) => conn.connectionType === 'property');

        for (const conn of propertyConnections) {
            const fromNode = nodes.find((n) => n.id === conn.from);
            const toNode = nodes.find((n) => n.id === conn.to);

            if (!fromNode || !toNode || !conn.toProperty) {
                logger.warn(`跳过无效的属性连接: from=${conn.from}, to=${conn.to}`);
                continue;
            }

            let variableName: string | undefined;

            if (fromNode.data.nodeType === 'blackboard-variable') {
                variableName = fromNode.data.variableName;
            } else if (conn.fromProperty) {
                variableName = conn.fromProperty;
            }

            if (!variableName) {
                logger.warn(`无法确定变量名: from节点=${fromNode.template.displayName}`);
                continue;
            }

            if (!blackboardVarNames.has(variableName)) {
                logger.warn(`属性绑定引用了不存在的黑板变量: ${variableName}`);
                continue;
            }

            bindings.push({
                nodeId: toNode.id,
                propertyName: conn.toProperty,
                variableName
            });
        }

        return bindings;
    }

    /**
     * 从资产格式转换回编辑器格式（用于加载）
     *
     * @param asset 行为树资产
     * @returns 编辑器格式数据
     */
    static fromAsset(asset: BehaviorTreeAsset): EditorFormat {
        logger.info('开始转换资产格式到编辑器格式');

        const nodes = this.convertNodesFromAsset(asset.nodes);

        const blackboard: Record<string, any> = {};
        for (const variable of asset.blackboard) {
            blackboard[variable.name] = variable.defaultValue;
        }

        const connections = this.convertPropertyBindingsToConnections(
            asset.propertyBindings || []
        );

        const nodeConnections = this.buildNodeConnections(asset.nodes);
        connections.push(...nodeConnections);

        const metadata: { name: string; description?: string; createdAt?: string; modifiedAt?: string } = {
            name: asset.metadata.name
        };

        if (asset.metadata.description) {
            metadata.description = asset.metadata.description;
        }

        if (asset.metadata.createdAt) {
            metadata.createdAt = asset.metadata.createdAt;
        }

        if (asset.metadata.modifiedAt) {
            metadata.modifiedAt = asset.metadata.modifiedAt;
        }

        const editorData: EditorFormat = {
            version: asset.metadata.version,
            metadata,
            nodes,
            connections,
            blackboard,
            canvasState: {
                offset: { x: 0, y: 0 },
                scale: 1
            }
        };

        logger.info(`转换完成: ${nodes.length}个节点, ${connections.length}个连接`);

        return editorData;
    }

    /**
     * 从资产格式转换节点
     */
    private static convertNodesFromAsset(assetNodes: BehaviorTreeNodeData[]): EditorNode[] {
        return assetNodes.map((node, index) => {
            const position = {
                x: 100 + (index % 5) * 250,
                y: 100 + Math.floor(index / 5) * 150
            };

            const template: any = {
                displayName: node.name,
                category: this.inferCategory(node.nodeType),
                type: node.nodeType
            };

            if (node.data.className) {
                template.className = node.data.className;
            }

            return {
                id: node.id,
                template,
                data: { ...node.data },
                position,
                children: node.children
            };
        });
    }

    /**
     * 推断节点分类
     */
    private static inferCategory(nodeType: NodeType): string {
        switch (nodeType) {
            case NodeType.Action:
                return '动作';
            case NodeType.Condition:
                return '条件';
            case NodeType.Composite:
                return '组合';
            case NodeType.Decorator:
                return '装饰器';
            default:
                return '其他';
        }
    }

    /**
     * 将属性绑定转换为连接
     */
    private static convertPropertyBindingsToConnections(
        bindings: PropertyBinding[]
    ): EditorConnection[] {
        const connections: EditorConnection[] = [];

        for (const binding of bindings) {
            connections.push({
                from: 'blackboard',
                to: binding.nodeId,
                toProperty: binding.propertyName,
                connectionType: 'property'
            });
        }

        return connections;
    }

    /**
     * 根据children关系构建节点连接
     */
    private static buildNodeConnections(nodes: BehaviorTreeNodeData[]): EditorConnection[] {
        const connections: EditorConnection[] = [];

        for (const node of nodes) {
            for (const childId of node.children) {
                connections.push({
                    from: node.id,
                    to: childId,
                    connectionType: 'node'
                });
            }
        }

        return connections;
    }
}

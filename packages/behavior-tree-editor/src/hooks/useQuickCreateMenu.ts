import { useState, type RefObject } from '@esengine/editor-runtime';
import type { NodeTemplate } from '@esengine/behavior-tree';
import { BehaviorTreeNode, Connection, useBehaviorTreeDataStore } from '../stores';
import { Node } from '../domain/models/Node';
import { Position } from '../domain/value-objects/Position';
import { useNodeOperations } from './useNodeOperations';
import { useConnectionOperations } from './useConnectionOperations';

interface QuickCreateMenuState {
    visible: boolean;
    position: { x: number; y: number };
    searchText: string;
    selectedIndex: number;
    mode: 'create' | 'replace';
    replaceNodeId: string | null;
}

type ExecutionMode = 'idle' | 'running' | 'paused';

interface UseQuickCreateMenuParams {
    nodeOperations: ReturnType<typeof useNodeOperations>;
    connectionOperations: ReturnType<typeof useConnectionOperations>;
    canvasRef: RefObject<HTMLDivElement>;
    canvasOffset: { x: number; y: number };
    canvasScale: number;
    connectingFrom: string | null;
    connectingFromProperty: string | null;
    clearConnecting: () => void;
    nodes: BehaviorTreeNode[];
    connections: Connection[];
    executionMode: ExecutionMode;
    onStop: () => void;
    onNodeCreate?: (template: NodeTemplate, position: { x: number; y: number }) => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useQuickCreateMenu(params: UseQuickCreateMenuParams) {
    const {
        nodeOperations,
        connectionOperations,
        canvasRef,
        canvasOffset,
        canvasScale,
        connectingFrom,
        connectingFromProperty,
        clearConnecting,
        nodes,
        connections,
        executionMode,
        onStop,
        onNodeCreate,
        showToast
    } = params;

    const [quickCreateMenu, setQuickCreateMenu] = useState<QuickCreateMenuState>({
        visible: false,
        position: { x: 0, y: 0 },
        searchText: '',
        selectedIndex: 0,
        mode: 'create',
        replaceNodeId: null
    });

    const handleReplaceNode = (newTemplate: NodeTemplate) => {
        const nodeToReplace = nodes.find((n) => n.id === quickCreateMenu.replaceNodeId);
        if (!nodeToReplace) return;

        // 如果行为树正在执行，先停止
        if (executionMode !== 'idle') {
            onStop();
        }

        // 合并数据：新模板的默认配置 + 保留旧节点中同名属性的值
        const newData = { ...newTemplate.defaultConfig };

        // 获取新模板的属性名列表
        const newPropertyNames = new Set(newTemplate.properties.map((p) => p.name));

        // 遍历旧节点的 data，保留新模板中也存在的属性
        for (const [key, value] of Object.entries(nodeToReplace.data)) {
            // 跳过节点类型相关的字段
            if (key === 'nodeType' || key === 'compositeType' || key === 'decoratorType' ||
                key === 'actionType' || key === 'conditionType') {
                continue;
            }

            // 如果新模板也有这个属性，保留旧值（包括绑定信息）
            if (newPropertyNames.has(key)) {
                newData[key] = value;
            }
        }

        // 创建新节点，保留原节点的位置和连接
        const newNode = new Node(
            nodeToReplace.id,
            newTemplate,
            newData,
            nodeToReplace.position,
            Array.from(nodeToReplace.children)
        );

        // 替换节点 - 通过 store 更新
        const store = useBehaviorTreeDataStore.getState();
        const updatedTree = store.tree.updateNode(newNode.id, () => newNode);
        store.setTree(updatedTree);

        // 删除所有指向该节点的属性连接，让用户重新连接
        const propertyConnections = connections.filter((conn) =>
            conn.connectionType === 'property' && conn.to === newNode.id
        );
        propertyConnections.forEach((conn) => {
            connectionOperations.removeConnection(
                conn.from,
                conn.to,
                conn.fromProperty,
                conn.toProperty
            );
        });

        // 关闭快速创建菜单
        closeQuickCreateMenu();

        // 显示提示
        showToast?.(`已将节点替换为 ${newTemplate.displayName}`, 'success');
    };

    const handleQuickCreateNode = (template: NodeTemplate) => {
        // 如果是替换模式，直接调用替换函数
        if (quickCreateMenu.mode === 'replace') {
            handleReplaceNode(template);
            return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) {
            return;
        }

        const posX = (quickCreateMenu.position.x - rect.left - canvasOffset.x) / canvasScale;
        const posY = (quickCreateMenu.position.y - rect.top - canvasOffset.y) / canvasScale;

        const newNode = nodeOperations.createNode(
            template,
            new Position(posX, posY),
            template.defaultConfig
        );

        // 如果有连接源，创建连接
        if (connectingFrom) {
            const fromNode = nodes.find((n: BehaviorTreeNode) => n.id === connectingFrom);
            if (fromNode) {
                if (connectingFromProperty) {
                    // 属性连接
                    connectionOperations.addConnection(
                        connectingFrom,
                        newNode.id,
                        'property',
                        connectingFromProperty,
                        undefined
                    );
                } else {
                    // 节点连接
                    connectionOperations.addConnection(connectingFrom, newNode.id, 'node');
                }
            }
        }

        closeQuickCreateMenu();

        onNodeCreate?.(template, { x: posX, y: posY });
    };

    const openQuickCreateMenu = (
        position: { x: number; y: number },
        mode: 'create' | 'replace',
        replaceNodeId?: string | null
    ) => {
        setQuickCreateMenu({
            visible: true,
            position,
            searchText: '',
            selectedIndex: 0,
            mode,
            replaceNodeId: replaceNodeId || null
        });
    };

    const closeQuickCreateMenu = () => {
        setQuickCreateMenu({
            visible: false,
            position: { x: 0, y: 0 },
            searchText: '',
            selectedIndex: 0,
            mode: 'create',
            replaceNodeId: null
        });
        clearConnecting();
    };

    return {
        quickCreateMenu,
        setQuickCreateMenu,
        handleQuickCreateNode,
        handleReplaceNode,
        openQuickCreateMenu,
        closeQuickCreateMenu
    };
}

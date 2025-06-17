import { Ref } from 'vue';
import { TreeNode } from '../types';
import { NodeTemplate } from '../data/nodeTemplates';

/**
 * 代码生成管理
 */
export function useCodeGeneration(
    treeNodes: Ref<TreeNode[]>,
    nodeTemplates: Ref<NodeTemplate[]>,
    getNodeByIdLocal: (id: string) => TreeNode | undefined,
    rootNode: () => TreeNode | null
) {
    
    // 生成行为树配置JSON
    const generateBehaviorTreeConfig = () => {
        const root = rootNode();
        
        if (!root) {
            return null;
        }
        
        return {
            version: "1.0.0",
            type: "behavior-tree",
            metadata: {
                createdAt: new Date().toISOString(),
                hasECSNodes: hasECSNodes(),
                nodeCount: treeNodes.value.length
            },
            tree: generateNodeConfig(root)
        };
    };

    // 生成可读的配置JSON字符串
    const generateConfigJSON = (): string => {
        const config = generateBehaviorTreeConfig();
        
        if (!config) {
            return '// 请先添加根节点';
        }
        
        return JSON.stringify(config, null, 2);
    };

    // 生成TypeScript构建代码（用于运行时从配置创建行为树）
    const generateTypeScriptCode = (): string => {
        const config = generateBehaviorTreeConfig();
        
        if (!config) {
            return '// 请先添加根节点';
        }
        
        const { behaviorTreeImports, ecsImports } = getRequiredImports();
        
        let importsCode = '';
        if (behaviorTreeImports.length > 0) {
            importsCode += `import { ${behaviorTreeImports.join(', ')}, BehaviorTreeBuilder } from '@esengine/ai';\n`;
        }
        if (ecsImports.length > 0) {
            importsCode += `import { ${ecsImports.join(', ')} } from '@esengine/ecs-framework';\n`;
        }
        
        const contextType = hasECSNodes() ? 'Entity' : 'any';
        const configString = JSON.stringify(config, null, 4);
        
        return `${importsCode}
// 行为树配置
const behaviorTreeConfig = ${configString};

// 从配置创建行为树
export function createBehaviorTree<T extends ${contextType}>(context?: T): BehaviorTree<T> {
    return BehaviorTreeBuilder.fromConfig<T>(behaviorTreeConfig, context);
}

// 直接导出配置（用于序列化保存）
export const config = behaviorTreeConfig;`;
    };

    const getRequiredImports = (): { behaviorTreeImports: string[], ecsImports: string[] } => {
        const behaviorTreeImports = new Set<string>();
        const ecsImports = new Set<string>();
        
        // 总是需要这些基础类
        behaviorTreeImports.add('BehaviorTree');
        behaviorTreeImports.add('TaskStatus');
        
        treeNodes.value.forEach(node => {
            const template = nodeTemplates.value.find(t => t.className === node.type || t.type === node.type);
            if (template?.className) {
                if (template.namespace?.includes('ecs-integration')) {
                    behaviorTreeImports.add(template.className);
                    ecsImports.add('Entity');
                    ecsImports.add('Component');
                } else {
                    behaviorTreeImports.add(template.className);
                }
            }
        });
        
        return {
            behaviorTreeImports: Array.from(behaviorTreeImports),
            ecsImports: Array.from(ecsImports)
        };
    };

    const hasECSNodes = (): boolean => {
        return treeNodes.value.some(node => {
            const template = nodeTemplates.value.find(t => t.className === node.type || t.type === node.type);
            return template?.namespace?.includes('ecs-integration');
        });
    };

    // 生成节点配置对象
    const generateNodeConfig = (node: TreeNode): any => {
        const template = nodeTemplates.value.find(t => t.className === node.type || t.type === node.type);
        
        if (!template || !template.className) {
            return {
                type: node.type,
                error: "未知节点类型"
            };
        }
        
        const nodeConfig: any = {
            id: node.id,
            type: template.className,
            namespace: template.namespace || 'behaviourTree',
            properties: {}
        };
        
        // 处理节点属性
        if (node.properties) {
            Object.entries(node.properties).forEach(([key, prop]) => {
                if (prop.value !== undefined && prop.value !== '') {
                    nodeConfig.properties[key] = {
                        type: prop.type,
                        value: prop.value
                    };
                }
            });
        }
        
        // 处理子节点
        if (node.children && node.children.length > 0) {
            nodeConfig.children = node.children
                .map(childId => getNodeByIdLocal(childId))
                .filter(Boolean)
                .map(child => generateNodeConfig(child!));
        }
        
        return nodeConfig;
    };

    const generateNodeCode = (node: TreeNode, indent: number = 0): string => {
        const spaces = '    '.repeat(indent);
        const template = nodeTemplates.value.find(t => t.className === node.type || t.type === node.type);
        
        if (!template || !template.className) {
            return `${spaces}// 未知节点类型: ${node.type}`;
        }
        
        let code = `${spaces}new ${template.className}(`;
        const params: string[] = [];
        
        // 处理特定节点的构造函数参数
        if (template.namespace?.includes('ecs-integration')) {
            // ECS节点的特殊处理
            switch (template.className) {
                case 'HasComponentCondition':
                case 'AddComponentAction':
                case 'RemoveComponentAction':
                case 'ModifyComponentAction':
                    if (node.properties?.componentType?.value) {
                        params.push(node.properties.componentType.value);
                    }
                    if (template.className === 'AddComponentAction' && node.properties?.componentFactory?.value) {
                        params.push(node.properties.componentFactory.value);
                    }
                    if (template.className === 'ModifyComponentAction' && node.properties?.modifierCode?.value) {
                        params.push(node.properties.modifierCode.value);
                    }
                    break;
                case 'HasTagCondition':
                    if (node.properties?.tag?.value !== undefined) {
                        params.push(node.properties.tag.value.toString());
                    }
                    break;
                case 'IsActiveCondition':
                    if (node.properties?.checkHierarchy?.value !== undefined) {
                        params.push(node.properties.checkHierarchy.value.toString());
                    }
                    break;
                case 'WaitTimeAction':
                    if (node.properties?.waitTime?.value !== undefined) {
                        params.push(node.properties.waitTime.value.toString());
                    }
                    break;
            }
        } else {
            // 普通行为树节点的处理
            switch (template.className) {
                case 'ExecuteAction':
                case 'ExecuteActionConditional':
                    if (node.properties?.actionCode?.value || node.properties?.conditionCode?.value) {
                        const code = node.properties.actionCode?.value || node.properties.conditionCode?.value;
                        params.push(code);
                        if (node.properties?.actionName?.value) {
                            params.push(`{ name: "${node.properties.actionName.value}" }`);
                        }
                    }
                    break;
                case 'WaitAction':
                    if (node.properties?.waitTime?.value !== undefined) {
                        params.push(node.properties.waitTime.value.toString());
                    }
                    break;
                case 'LogAction':
                    if (node.properties?.message?.value) {
                        params.push(`"${node.properties.message.value}"`);
                    }
                    break;
                case 'Repeater':
                    if (node.properties?.repeatCount?.value !== undefined) {
                        params.push(node.properties.repeatCount.value.toString());
                    }
                    break;
                case 'Sequence':
                case 'Selector':
                    if (node.properties?.abortType?.value && node.properties.abortType.value !== 'None') {
                        params.push(`AbortTypes.${node.properties.abortType.value}`);
                    }
                    break;
            }
        }
        
        code += params.join(', ');
        code += ')';
        
        // 处理子节点（对于复合节点和装饰器）
        if (template.canHaveChildren && node.children && node.children.length > 0) {
            const children = node.children
                .map(childId => getNodeByIdLocal(childId))
                .filter(Boolean)
                .map(child => generateNodeCode(child!, indent + 1));
            
            if (children.length > 0) {
                const className = template.className; // 保存到局部变量
                if (template.category === 'decorator') {
                    // 装饰器只有一个子节点
                    code = code.slice(0, -1); // 移除最后的 ')'
                    const varName = className.toLowerCase();
                    code += `;\n${spaces}${varName}.child = ${children[0].trim()};\n${spaces}return ${varName}`;
                } else if (template.category === 'composite') {
                    // 复合节点需要添加子节点
                    code = code.slice(0, -1); // 移除最后的 ')'
                    code += `;\n`;
                    children.forEach(child => {
                        code += `${spaces}${className.toLowerCase()}.addChild(${child.trim()});\n`;
                    });
                    code += `${spaces}return ${className.toLowerCase()}`;
                }
            }
        }
        
        return code;
    };

    // 从配置创建行为树节点
    const createTreeFromConfig = (config: any): TreeNode[] => {
        if (!config || !config.tree) {
            return [];
        }
        
        const nodes: TreeNode[] = [];
        const processNode = (nodeConfig: any, parent?: TreeNode): TreeNode => {
            const template = nodeTemplates.value.find(t => t.className === nodeConfig.type);
            if (!template) {
                throw new Error(`未知节点类型: ${nodeConfig.type}`);
            }
            
            const node: TreeNode = {
                id: nodeConfig.id || generateNodeId(),
                type: template.type,
                name: template.name,
                icon: template.icon,
                description: template.description,
                canHaveChildren: template.canHaveChildren,
                canHaveParent: template.canHaveParent,
                x: 400,  // 默认在画布中心
                y: 100,  // 从顶部开始
                properties: {},
                children: [],
                parent: parent?.id // 设置父节点ID
            };
            
            // 恢复属性
            if (nodeConfig.properties) {
                Object.entries(nodeConfig.properties).forEach(([key, propConfig]: [string, any]) => {
                    if (template.properties?.[key]) {
                        node.properties![key] = {
                            ...template.properties[key],
                            value: propConfig.value
                        };
                    }
                });
            }
            
            nodes.push(node);
            
            // 处理子节点
            if (nodeConfig.children && Array.isArray(nodeConfig.children)) {
                nodeConfig.children.forEach((childConfig: any) => {
                    const childNode = processNode(childConfig, node);
                    node.children!.push(childNode.id);
                });
            }
            
            return node;
        };
        
        processNode(config.tree);
        return nodes;
    };
    
    // 生成唯一节点ID
    const generateNodeId = (): string => {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    return {
        generateBehaviorTreeConfig,
        generateConfigJSON,
        generateTypeScriptCode,
        generateNodeCode,
        generateNodeConfig,
        createTreeFromConfig,
        getRequiredImports
    };
} 
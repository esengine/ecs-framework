import { useState, type RefObject, React, createLogger } from '@esengine/editor-runtime';
import { NodeType, type NodeTemplate } from '@esengine/behavior-tree';
import { Position } from '../domain/value-objects/Position';
import { useNodeOperations } from './useNodeOperations';

const logger = createLogger('useDropHandler');

interface DraggedVariableData {
    variableName: string;
}

interface UseDropHandlerParams {
    canvasRef: RefObject<HTMLDivElement>;
    canvasOffset: { x: number; y: number };
    canvasScale: number;
    nodeOperations: ReturnType<typeof useNodeOperations>;
    onNodeCreate?: (template: NodeTemplate, position: { x: number; y: number }) => void;
}

export function useDropHandler(params: UseDropHandlerParams) {
    const {
        canvasRef,
        canvasOffset,
        canvasScale,
        nodeOperations,
        onNodeCreate
    } = params;

    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        try {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const position = {
                x: (e.clientX - rect.left - canvasOffset.x) / canvasScale,
                y: (e.clientY - rect.top - canvasOffset.y) / canvasScale
            };

            const blackboardVariableData = e.dataTransfer.getData('application/blackboard-variable');
            if (blackboardVariableData) {
                const variableData = JSON.parse(blackboardVariableData) as DraggedVariableData;

                const variableTemplate: NodeTemplate = {
                    type: NodeType.Action,
                    displayName: variableData.variableName,
                    category: 'Blackboard Variable',
                    icon: 'Database',
                    description: `Blackboard variable: ${variableData.variableName}`,
                    color: '#9c27b0',
                    defaultConfig: {
                        nodeType: 'blackboard-variable',
                        variableName: variableData.variableName
                    },
                    properties: [
                        {
                            name: 'variableName',
                            label: '变量名',
                            type: 'variable',
                            defaultValue: variableData.variableName,
                            description: '黑板变量的名称',
                            required: true
                        }
                    ]
                };

                nodeOperations.createNode(
                    variableTemplate,
                    new Position(position.x, position.y),
                    {
                        nodeType: 'blackboard-variable',
                        variableName: variableData.variableName
                    }
                );
                return;
            }

            let templateData = e.dataTransfer.getData('application/behavior-tree-node');
            if (!templateData) {
                templateData = e.dataTransfer.getData('text/plain');
            }
            if (!templateData) {
                return;
            }

            const template = JSON.parse(templateData) as NodeTemplate;

            nodeOperations.createNode(
                template,
                new Position(position.x, position.y),
                template.defaultConfig
            );

            onNodeCreate?.(template, position);
        } catch (error) {
            logger.error('Failed to create node:', error);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragging) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return {
        isDragging,
        handleDrop,
        handleDragOver,
        handleDragLeave,
        handleDragEnter
    };
}

import { React, createLogger } from '@esengine/editor-runtime';
import type { LucideIcon } from '@esengine/editor-runtime';
import type { NodeTemplate } from '@esengine/behavior-tree';
import { Node as BehaviorTreeNode } from '../domain/models/Node';

const logger = createLogger('IEditorExtensions');

export interface INodeRenderer {
    canRender(node: BehaviorTreeNode): boolean;

    render(node: BehaviorTreeNode, context: NodeRenderContext): React.ReactElement;
}

export interface NodeRenderContext {
    isSelected: boolean;
    isExecuting: boolean;
    onNodeClick: (e: React.MouseEvent, node: BehaviorTreeNode) => void;
    onContextMenu: (e: React.MouseEvent, node: BehaviorTreeNode) => void;
}

export interface IPropertyEditor {
    canEdit(propertyType: string): boolean;

    render(property: PropertyEditorProps): React.ReactElement;
}

export type PropertyValue = string | number | boolean | object | null | undefined;

export interface PropertyEditorProps<T = PropertyValue> {
    propertyName: string;
    propertyType: string;
    value: T;
    onChange: (value: T) => void;
    config?: Record<string, PropertyValue>;
}

export interface INodeProvider {
    getNodeTemplates(): NodeTemplate[];

    getCategory(): string;

    getIcon(): string | LucideIcon;
}

export interface IToolbarButton {
    id: string;
    label: string;
    icon: LucideIcon;
    tooltip?: string;
    onClick: () => void;
    isVisible?: () => boolean;
    isEnabled?: () => boolean;
}

export interface IPanelProvider {
    id: string;
    title: string;
    icon?: LucideIcon;

    render(): React.ReactElement;

    canActivate?(): boolean;
}

export interface IEditorValidator {
    name: string;

    validate(nodes: BehaviorTreeNode[]): EditorValidationResult[];
}

export interface EditorValidationResult {
    severity: 'error' | 'warning' | 'info';
    nodeId?: string;
    message: string;
    code?: string;
}

export interface ICommandProvider {
    getCommandId(): string;

    getCommandName(): string;

    getShortcut?(): string;

    canExecute?(): boolean;

    execute(context: CommandExecutionContext): void | Promise<void>;
}

export interface CommandExecutionContext {
    selectedNodeIds: string[];
    nodes: BehaviorTreeNode[];
    currentFile?: string;
}

export class EditorExtensionRegistry {
    private nodeRenderers: Set<INodeRenderer> = new Set();
    private propertyEditors: Set<IPropertyEditor> = new Set();
    private nodeProviders: Set<INodeProvider> = new Set();
    private toolbarButtons: Set<IToolbarButton> = new Set();
    private panelProviders: Set<IPanelProvider> = new Set();
    private validators: Set<IEditorValidator> = new Set();
    private commandProviders: Set<ICommandProvider> = new Set();

    registerNodeRenderer(renderer: INodeRenderer): void {
        this.nodeRenderers.add(renderer);
    }

    unregisterNodeRenderer(renderer: INodeRenderer): void {
        this.nodeRenderers.delete(renderer);
    }

    getNodeRenderer(node: BehaviorTreeNode): INodeRenderer | undefined {
        for (const renderer of this.nodeRenderers) {
            if (renderer.canRender(node)) {
                return renderer;
            }
        }
        return undefined;
    }

    registerPropertyEditor(editor: IPropertyEditor): void {
        this.propertyEditors.add(editor);
    }

    unregisterPropertyEditor(editor: IPropertyEditor): void {
        this.propertyEditors.delete(editor);
    }

    getPropertyEditor(propertyType: string): IPropertyEditor | undefined {
        for (const editor of this.propertyEditors) {
            if (editor.canEdit(propertyType)) {
                return editor;
            }
        }
        return undefined;
    }

    registerNodeProvider(provider: INodeProvider): void {
        this.nodeProviders.add(provider);
    }

    unregisterNodeProvider(provider: INodeProvider): void {
        this.nodeProviders.delete(provider);
    }

    getAllNodeTemplates(): NodeTemplate[] {
        const templates: NodeTemplate[] = [];
        this.nodeProviders.forEach((provider) => {
            templates.push(...provider.getNodeTemplates());
        });
        return templates;
    }

    registerToolbarButton(button: IToolbarButton): void {
        this.toolbarButtons.add(button);
    }

    unregisterToolbarButton(button: IToolbarButton): void {
        this.toolbarButtons.delete(button);
    }

    getToolbarButtons(): IToolbarButton[] {
        return Array.from(this.toolbarButtons).filter((btn) => {
            return btn.isVisible ? btn.isVisible() : true;
        });
    }

    registerPanelProvider(provider: IPanelProvider): void {
        this.panelProviders.add(provider);
    }

    unregisterPanelProvider(provider: IPanelProvider): void {
        this.panelProviders.delete(provider);
    }

    getPanelProviders(): IPanelProvider[] {
        return Array.from(this.panelProviders).filter((panel) => {
            return panel.canActivate ? panel.canActivate() : true;
        });
    }

    registerValidator(validator: IEditorValidator): void {
        this.validators.add(validator);
    }

    unregisterValidator(validator: IEditorValidator): void {
        this.validators.delete(validator);
    }

    async validateTree(nodes: BehaviorTreeNode[]): Promise<EditorValidationResult[]> {
        const results: EditorValidationResult[] = [];
        for (const validator of this.validators) {
            try {
                const validationResults = validator.validate(nodes);
                results.push(...validationResults);
            } catch (error) {
                logger.error(`Error in validator ${validator.name}:`, error);
                results.push({
                    severity: 'error',
                    message: `Validator ${validator.name} failed: ${error}`,
                    code: 'VALIDATOR_ERROR'
                });
            }
        }
        return results;
    }

    registerCommandProvider(provider: ICommandProvider): void {
        this.commandProviders.add(provider);
    }

    unregisterCommandProvider(provider: ICommandProvider): void {
        this.commandProviders.delete(provider);
    }

    getCommandProvider(commandId: string): ICommandProvider | undefined {
        for (const provider of this.commandProviders) {
            if (provider.getCommandId() === commandId) {
                return provider;
            }
        }
        return undefined;
    }

    getAllCommandProviders(): ICommandProvider[] {
        return Array.from(this.commandProviders);
    }

    clear(): void {
        this.nodeRenderers.clear();
        this.propertyEditors.clear();
        this.nodeProviders.clear();
        this.toolbarButtons.clear();
        this.panelProviders.clear();
        this.validators.clear();
        this.commandProviders.clear();
    }
}

let globalExtensionRegistry: EditorExtensionRegistry | null = null;

export function getGlobalExtensionRegistry(): EditorExtensionRegistry {
    if (!globalExtensionRegistry) {
        globalExtensionRegistry = new EditorExtensionRegistry();
    }
    return globalExtensionRegistry;
}

export function resetGlobalExtensionRegistry(): void {
    globalExtensionRegistry = null;
}

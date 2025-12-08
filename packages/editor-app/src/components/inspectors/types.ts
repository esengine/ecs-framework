import { Entity } from '@esengine/esengine';
import { EntityStoreService, MessageHub, InspectorRegistry, CommandManager } from '@esengine/editor-core';

export interface InspectorProps {
    entityStore: EntityStoreService;
    messageHub: MessageHub;
    inspectorRegistry: InspectorRegistry;
    projectPath?: string | null;
    commandManager: CommandManager;
}

export interface AssetFileInfo {
    name: string;
    path: string;
    extension?: string;
    size?: number;
    modified?: number;
    isDirectory: boolean;
}

type ExtensionData = Record<string, any>;

export type InspectorTarget =
    | { type: 'entity'; data: Entity }
    | { type: 'remote-entity'; data: RemoteEntity; details?: EntityDetails }
    | { type: 'asset-file'; data: AssetFileInfo; content?: string; isImage?: boolean }
    | { type: 'extension'; data: ExtensionData }
    | null;

export interface RemoteEntity {
    id: number;
    destroyed?: boolean;
    componentTypes?: string[];
    name?: string;
    enabled?: boolean;
    tag?: number;
    depth?: number;
    updateOrder?: number;
    parentId?: number | null;
    childCount?: number;
    activeInHierarchy?: boolean;
    componentMask?: string;
}

export interface ComponentData {
    typeName: string;
    properties: Record<string, any>;
}

export interface EntityDetails {
    id: number;
    components?: ComponentData[];
    componentTypes?: string[];
    [key: string]: any;
}

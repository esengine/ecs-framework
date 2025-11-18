import { Entity } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, InspectorRegistry } from '@esengine/editor-core';

export interface InspectorProps {
    entityStore: EntityStoreService;
    messageHub: MessageHub;
    inspectorRegistry: InspectorRegistry;
    projectPath?: string | null;
}

export interface AssetFileInfo {
    name: string;
    path: string;
    extension?: string;
    size?: number;
    modified?: number;
    isDirectory: boolean;
}

export type InspectorTarget =
    | { type: 'entity'; data: Entity }
    | { type: 'remote-entity'; data: any; details?: any }
    | { type: 'asset-file'; data: AssetFileInfo; content?: string; isImage?: boolean }
    | { type: 'extension'; data: unknown }
    | null;

export interface RemoteEntity {
    id: number;
    destroyed?: boolean;
    componentTypes?: string[];
}

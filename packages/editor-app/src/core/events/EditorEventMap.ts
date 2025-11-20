import type { Entity, Component } from '@esengine/ecs-framework';

export interface PluginEvent {
    name: string;
    category?: string;
}

export interface EntityEvent {
    entity: Entity;
}

export interface ComponentEvent {
    entity: Entity;
    component: Component;
}

export interface ComponentPropertyChangedEvent {
    entity: Entity;
    component: Component;
    property: string;
    value: unknown;
}

export interface AssetFileEvent {
    path: string;
    type?: string;
}

export interface BehaviorTreeNodeEvent {
    node: Node;
}

export interface BehaviorTreeLoadFileEvent {
    filePath: string;
}

export interface DynamicPanelEvent {
    panelId: string;
    data?: unknown;
}

export interface UIWindowEvent {
    windowId: string;
    data?: unknown;
}

export interface FullscreenEvent {
    fullscreen: boolean;
}

export interface LocaleChangedEvent {
    locale: string;
}

export interface NotificationEvent {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

export interface SceneEvent {
    scenePath?: string;
}

export interface EditorEventMap extends Record<string, unknown> {
    'plugin:installed': PluginEvent;
    'plugin:enabled': PluginEvent;
    'plugin:disabled': PluginEvent;

    'entity:selected': EntityEvent;
    'remote-entity:selected': EntityEvent;
    'entity:added': EntityEvent;
    'entity:removed': EntityEvent;
    'entities:cleared': Record<string, never>;

    'component:added': ComponentEvent;
    'component:removed': ComponentEvent;
    'component:property:changed': ComponentPropertyChangedEvent;

    'asset:reveal': AssetFileEvent;
    'asset-file:selected': AssetFileEvent;

    'behavior-tree:node-selected': BehaviorTreeNodeEvent;
    'behavior-tree:load-file': BehaviorTreeLoadFileEvent;

    'dynamic-panel:open': DynamicPanelEvent;
    'ui:openWindow': UIWindowEvent;
    'editor:fullscreen': FullscreenEvent;

    'locale:changed': LocaleChangedEvent;
    'notification:show': NotificationEvent;

    'scene:loaded': SceneEvent;
    'scene:new': SceneEvent;
    'scene:saved': SceneEvent;
    'scene:modified': SceneEvent;
}

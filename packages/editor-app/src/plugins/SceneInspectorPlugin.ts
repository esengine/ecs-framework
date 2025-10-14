import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { IEditorPlugin, EditorPluginCategory, PanelPosition } from '@esengine/editor-core';
import type { MenuItem, ToolbarItem, PanelDescriptor, ISerializer } from '@esengine/editor-core';

/**
 * Scene Inspector 插件
 *
 * 提供场景层级视图和实体检视功能
 */
export class SceneInspectorPlugin implements IEditorPlugin {
  readonly name = '@esengine/scene-inspector';
  readonly version = '1.0.0';
  readonly displayName = 'Scene Inspector';
  readonly category = EditorPluginCategory.Inspector;
  readonly description = 'Scene hierarchy and entity inspector';
  readonly icon = '🔍';

  async install(_core: Core, _services: ServiceContainer): Promise<void> {
    console.log('[SceneInspectorPlugin] Installed');
  }

  async uninstall(): Promise<void> {
    console.log('[SceneInspectorPlugin] Uninstalled');
  }

  registerMenuItems(): MenuItem[] {
    return [
      {
        id: 'view-scene-inspector',
        label: 'Scene Inspector',
        parentId: 'view',
        onClick: () => {
          console.log('Toggle Scene Inspector');
        },
        shortcut: 'Ctrl+Shift+I',
        order: 100
      },
      {
        id: 'scene-create-entity',
        label: 'Create Entity',
        parentId: 'scene',
        onClick: () => {
          console.log('Create new entity');
        },
        shortcut: 'Ctrl+N',
        order: 10
      }
    ];
  }

  registerToolbar(): ToolbarItem[] {
    return [
      {
        id: 'toolbar-create-entity',
        label: 'New Entity',
        groupId: 'entity-tools',
        icon: '➕',
        onClick: () => {
          console.log('Create entity from toolbar');
        },
        order: 10
      },
      {
        id: 'toolbar-delete-entity',
        label: 'Delete Entity',
        groupId: 'entity-tools',
        icon: '🗑️',
        onClick: () => {
          console.log('Delete entity from toolbar');
        },
        order: 20
      }
    ];
  }

  registerPanels(): PanelDescriptor[] {
    return [
      {
        id: 'panel-scene-hierarchy',
        title: 'Scene Hierarchy',
        position: PanelPosition.Left,
        defaultSize: 250,
        resizable: true,
        closable: false,
        icon: '📋',
        order: 10
      },
      {
        id: 'panel-entity-inspector',
        title: 'Entity Inspector',
        position: PanelPosition.Right,
        defaultSize: 300,
        resizable: true,
        closable: false,
        icon: '🔎',
        order: 10
      }
    ];
  }

  getSerializers(): ISerializer[] {
    return [
      {
        serialize: (data: any) => {
          const json = JSON.stringify(data);
          const encoder = new TextEncoder();
          return encoder.encode(json);
        },
        deserialize: (data: Uint8Array) => {
          const decoder = new TextDecoder();
          const json = decoder.decode(data);
          return JSON.parse(json);
        },
        getSupportedType: () => 'scene'
      }
    ];
  }

  async onEditorReady(): Promise<void> {
    console.log('[SceneInspectorPlugin] Editor is ready');
  }

  async onProjectOpen(projectPath: string): Promise<void> {
    console.log(`[SceneInspectorPlugin] Project opened: ${projectPath}`);
  }

  async onProjectClose(): Promise<void> {
    console.log('[SceneInspectorPlugin] Project closed');
  }
}

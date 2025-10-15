import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { IEditorPlugin, EditorPluginCategory, MenuItem, MessageHub } from '@esengine/editor-core';

/**
 * Profiler Plugin
 *
 * Displays real-time performance metrics for ECS systems
 */
export class ProfilerPlugin implements IEditorPlugin {
  readonly name = '@esengine/profiler';
  readonly version = '1.0.0';
  readonly displayName = 'Performance Profiler';
  readonly category = EditorPluginCategory.Tool;
  readonly description = 'Real-time performance monitoring for ECS systems';
  readonly icon = '📊';

  private messageHub: MessageHub | null = null;

  async install(_core: Core, services: ServiceContainer): Promise<void> {
    this.messageHub = services.resolve(MessageHub);
    console.log('[ProfilerPlugin] Installed');
  }

  async uninstall(): Promise<void> {
    console.log('[ProfilerPlugin] Uninstalled');
  }

  async onEditorReady(): Promise<void> {
    console.log('[ProfilerPlugin] Editor is ready');
  }

  registerMenuItems(): MenuItem[] {
    const items = [
      {
        id: 'window.profiler',
        label: 'Profiler',
        parentId: 'window',
        order: 100,
        onClick: () => {
          console.log('[ProfilerPlugin] Menu item clicked!');
          this.messageHub?.publish('ui:openWindow', { windowId: 'profiler' });
        }
      }
    ];
    console.log('[ProfilerPlugin] Registering menu items:', items);
    return items;
  }
}

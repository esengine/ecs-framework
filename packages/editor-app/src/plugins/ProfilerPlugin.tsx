import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { IEditorPlugin, EditorPluginCategory, MenuItem, MessageHub, PanelDescriptor } from '@esengine/editor-core';
import { ProfilerDockPanel } from '../components/ProfilerDockPanel';
import { ProfilerService } from '../services/ProfilerService';

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
  private profilerService: ProfilerService | null = null;

  async install(_core: Core, services: ServiceContainer): Promise<void> {
    this.messageHub = services.resolve(MessageHub);

    // 创建并启动 ProfilerService
    this.profilerService = new ProfilerService();

    // 将服务实例存储到全局，供组件访问
    (window as any).__PROFILER_SERVICE__ = this.profilerService;

    console.log('[ProfilerPlugin] Installed and ProfilerService started');
  }

  async uninstall(): Promise<void> {
    // 清理 ProfilerService
    if (this.profilerService) {
      this.profilerService.destroy();
      this.profilerService = null;
    }

    delete (window as any).__PROFILER_SERVICE__;

    console.log('[ProfilerPlugin] Uninstalled and ProfilerService stopped');
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

  registerPanels(): PanelDescriptor[] {
    return [
      {
        id: 'profiler-monitor',
        title: 'Performance Monitor',
        position: 'center' as any,
        closable: true,
        component: ProfilerDockPanel,
        order: 200
      }
    ];
  }
}

import { Core } from '../../src/Core';
import { IPlugin } from '../../src/Core/Plugin';
import { PluginManager } from '../../src/Core/PluginManager';
import type { ServiceContainer } from '../../src/Core/ServiceContainer';

describe('插件系统', () => {
    let core: Core;

    beforeEach(() => {
        core = Core.create({ debug: false });
    });

    afterEach(() => {
        Core.destroy();
    });

    describe('基本功能', () => {
        it('应该能够安装插件', async () => {
            class TestPlugin implements IPlugin {
                readonly name = 'test-plugin';
                readonly version = '1.0.0';
                installed = false;

                install() {
                    this.installed = true;
                }

                uninstall() {
                    this.installed = false;
                }
            }

            const plugin = new TestPlugin();
            await Core.installPlugin(plugin);

            expect(plugin.installed).toBe(true);
            expect(Core.isPluginInstalled('test-plugin')).toBe(true);
        });

        it('应该能够卸载插件', async () => {
            class TestPlugin implements IPlugin {
                readonly name = 'test-plugin';
                readonly version = '1.0.0';
                installed = false;

                install() {
                    this.installed = true;
                }

                uninstall() {
                    this.installed = false;
                }
            }

            const plugin = new TestPlugin();
            await Core.installPlugin(plugin);
            expect(plugin.installed).toBe(true);

            await Core.uninstallPlugin('test-plugin');
            expect(plugin.installed).toBe(false);
            expect(Core.isPluginInstalled('test-plugin')).toBe(false);
        });

        it('应该能够获取已安装的插件', async () => {
            class TestPlugin implements IPlugin {
                readonly name = 'test-plugin';
                readonly version = '1.0.0';

                install() {}
                uninstall() {}
            }

            const plugin = new TestPlugin();
            await Core.installPlugin(plugin);

            const installed = Core.getPlugin('test-plugin');
            expect(installed).toBe(plugin);
            expect(installed?.version).toBe('1.0.0');
        });

        it('应该拒绝重复安装同一个插件', async () => {
            class TestPlugin implements IPlugin {
                readonly name = 'test-plugin';
                readonly version = '1.0.0';

                install() {}
                uninstall() {}
            }

            const plugin1 = new TestPlugin();
            const plugin2 = new TestPlugin();

            await Core.installPlugin(plugin1);
            await Core.installPlugin(plugin2);

            expect(Core.getPlugin('test-plugin')).toBe(plugin1);
        });
    });

    describe('依赖管理', () => {
        it('应该检查插件依赖', async () => {
            class BasePlugin implements IPlugin {
                readonly name = 'base-plugin';
                readonly version = '1.0.0';

                install() {}
                uninstall() {}
            }

            class DependentPlugin implements IPlugin {
                readonly name = 'dependent-plugin';
                readonly version = '1.0.0';
                readonly dependencies = ['base-plugin'] as const;

                install() {}
                uninstall() {}
            }

            const dependentPlugin = new DependentPlugin();

            await expect(Core.installPlugin(dependentPlugin)).rejects.toThrow(
                'unmet dependencies'
            );
        });

        it('应该允许按正确顺序安装有依赖的插件', async () => {
            class BasePlugin implements IPlugin {
                readonly name = 'base-plugin';
                readonly version = '1.0.0';

                install() {}
                uninstall() {}
            }

            class DependentPlugin implements IPlugin {
                readonly name = 'dependent-plugin';
                readonly version = '1.0.0';
                readonly dependencies = ['base-plugin'] as const;

                install() {}
                uninstall() {}
            }

            const basePlugin = new BasePlugin();
            const dependentPlugin = new DependentPlugin();

            await Core.installPlugin(basePlugin);
            await Core.installPlugin(dependentPlugin);

            expect(Core.isPluginInstalled('base-plugin')).toBe(true);
            expect(Core.isPluginInstalled('dependent-plugin')).toBe(true);
        });

        it('应该防止卸载被依赖的插件', async () => {
            class BasePlugin implements IPlugin {
                readonly name = 'base-plugin';
                readonly version = '1.0.0';

                install() {}
                uninstall() {}
            }

            class DependentPlugin implements IPlugin {
                readonly name = 'dependent-plugin';
                readonly version = '1.0.0';
                readonly dependencies = ['base-plugin'] as const;

                install() {}
                uninstall() {}
            }

            await Core.installPlugin(new BasePlugin());
            await Core.installPlugin(new DependentPlugin());

            await expect(Core.uninstallPlugin('base-plugin')).rejects.toThrow(
                'required by'
            );
        });
    });

    describe('服务注册', () => {
        it('应该允许插件注册服务', async () => {
            class TestService {
                public value = 42;
                dispose() {}
            }

            class ServicePlugin implements IPlugin {
                readonly name = 'service-plugin';
                readonly version = '1.0.0';

                install(core: Core, services: ServiceContainer) {
                    services.registerSingleton(TestService);
                }

                uninstall() {}
            }

            await Core.installPlugin(new ServicePlugin());

            const service = Core.services.resolve(TestService);
            expect(service.value).toBe(42);
        });

        it('应该允许插件访问Core和ServiceContainer', async () => {
            let capturedCore: Core | null = null;
            let capturedServices: ServiceContainer | null = null;

            class TestPlugin implements IPlugin {
                readonly name = 'test-plugin';
                readonly version = '1.0.0';

                install(core: Core, services: ServiceContainer) {
                    capturedCore = core;
                    capturedServices = services;
                }

                uninstall() {}
            }

            await Core.installPlugin(new TestPlugin());

            expect(capturedCore).toBe(Core.Instance);
            expect(capturedServices).toBe(Core.services);
        });
    });

    describe('异步插件', () => {
        it('应该支持异步安装', async () => {
            class AsyncPlugin implements IPlugin {
                readonly name = 'async-plugin';
                readonly version = '1.0.0';
                initialized = false;

                async install() {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    this.initialized = true;
                }

                uninstall() {}
            }

            const plugin = new AsyncPlugin();
            await Core.installPlugin(plugin);

            expect(plugin.initialized).toBe(true);
        });

        it('应该支持异步卸载', async () => {
            class AsyncPlugin implements IPlugin {
                readonly name = 'async-plugin';
                readonly version = '1.0.0';
                cleaned = false;

                install() {}

                async uninstall() {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    this.cleaned = true;
                }
            }

            const plugin = new AsyncPlugin();
            await Core.installPlugin(plugin);
            await Core.uninstallPlugin('async-plugin');

            expect(plugin.cleaned).toBe(true);
        });
    });

    describe('错误处理', () => {
        it('应该捕获安装错误', async () => {
            class FailingPlugin implements IPlugin {
                readonly name = 'failing-plugin';
                readonly version = '1.0.0';

                install() {
                    throw new Error('安装失败');
                }

                uninstall() {}
            }

            await expect(Core.installPlugin(new FailingPlugin())).rejects.toThrow(
                '安装失败'
            );

            expect(Core.isPluginInstalled('failing-plugin')).toBe(false);
        });

        it('应该捕获卸载错误', async () => {
            class FailingPlugin implements IPlugin {
                readonly name = 'failing-plugin';
                readonly version = '1.0.0';

                install() {}

                uninstall() {
                    throw new Error('卸载失败');
                }
            }

            await Core.installPlugin(new FailingPlugin());

            await expect(Core.uninstallPlugin('failing-plugin')).rejects.toThrow(
                '卸载失败'
            );
        });
    });

    describe('PluginManager直接使用', () => {
        it('应该能够从ServiceContainer获取PluginManager', () => {
            const pluginManager = Core.services.resolve(PluginManager);
            expect(pluginManager).toBeDefined();
        });

        it('应该能够获取所有插件', async () => {
            class Plugin1 implements IPlugin {
                readonly name = 'plugin1';
                readonly version = '1.0.0';
                install() {}
                uninstall() {}
            }

            class Plugin2 implements IPlugin {
                readonly name = 'plugin2';
                readonly version = '2.0.0';
                install() {}
                uninstall() {}
            }

            await Core.installPlugin(new Plugin1());
            await Core.installPlugin(new Plugin2());

            const pluginManager = Core.services.resolve(PluginManager);
            const allPlugins = pluginManager.getAllPlugins();

            expect(allPlugins).toHaveLength(2);
            expect(allPlugins.map(p => p.name)).toContain('plugin1');
            expect(allPlugins.map(p => p.name)).toContain('plugin2');
        });

        it('应该能够获取插件元数据', async () => {
            class TestPlugin implements IPlugin {
                readonly name = 'test-plugin';
                readonly version = '1.0.0';
                install() {}
                uninstall() {}
            }

            await Core.installPlugin(new TestPlugin());

            const pluginManager = Core.services.resolve(PluginManager);
            const metadata = pluginManager.getMetadata('test-plugin');

            expect(metadata).toBeDefined();
            expect(metadata?.name).toBe('test-plugin');
            expect(metadata?.version).toBe('1.0.0');
            expect(metadata?.state).toBe('installed');
            expect(metadata?.installedAt).toBeDefined();
        });
    });

    describe('生命周期', () => {
        it('应该在Core销毁时卸载所有插件', async () => {
            const uninstallCalls: string[] = [];

            class Plugin1 implements IPlugin {
                readonly name = 'plugin1';
                readonly version = '1.0.0';
                install() {}
                uninstall() {
                    uninstallCalls.push('plugin1');
                }
            }

            class Plugin2 implements IPlugin {
                readonly name = 'plugin2';
                readonly version = '1.0.0';
                readonly dependencies = ['plugin1'] as const;
                install() {}
                uninstall() {
                    uninstallCalls.push('plugin2');
                }
            }

            await Core.installPlugin(new Plugin1());
            await Core.installPlugin(new Plugin2());

            Core.destroy();

            expect(uninstallCalls).toContain('plugin1');
            expect(uninstallCalls).toContain('plugin2');
        });
    });
});

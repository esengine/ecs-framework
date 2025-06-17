/* eslint-disable vue/one-component-per-file */

import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { createApp, App, defineComponent, ref, onMounted } from 'vue';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

const panelDataMap = new WeakMap<any, App>();

/**
 * 检测ECS框架安装状态的工具函数
 */
async function checkEcsFrameworkStatus(projectPath: string) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const nodeModulesPath = path.join(projectPath, 'node_modules', '@esengine', 'ecs-framework');
    
    try {
        // 检查package.json是否存在
        const packageJsonExists = fs.existsSync(packageJsonPath);
        if (!packageJsonExists) {
            return {
                packageJsonExists: false,
                ecsInstalled: false,
                ecsVersion: null
            };
        }

        // 读取package.json
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        // 检查依赖中是否包含ECS框架
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const ecsInDeps = dependencies['@esengine/ecs-framework'];
        
        // 检查node_modules中是否实际安装了ECS框架
        const ecsActuallyInstalled = fs.existsSync(nodeModulesPath);
        
        let ecsVersion = null;
        if (ecsActuallyInstalled) {
            try {
                const ecsPackageJson = JSON.parse(
                    fs.readFileSync(path.join(nodeModulesPath, 'package.json'), 'utf-8')
                );
                ecsVersion = ecsPackageJson.version;
            } catch (e) {
                console.warn('Unable to read ECS framework version:', e);
            }
        }

        return {
            packageJsonExists: true,
            ecsInstalled: ecsActuallyInstalled && !!ecsInDeps,
            ecsVersion,
            declaredVersion: ecsInDeps
        };
    } catch (error) {
        console.error('Error checking ECS framework status:', error);
        return {
            packageJsonExists: false,
            ecsInstalled: false,
            ecsVersion: null
        };
    }
}

/**
 * 检测ECS模板状态
 */
function checkEcsTemplateStatus(projectPath: string) {
    const ecsDir = path.join(projectPath, 'assets', 'scripts', 'ecs');
    
    try {
        if (!fs.existsSync(ecsDir)) {
            return {
                templateExists: false,
                existingFiles: []
            };
        }

        // 扫描ECS目录中的文件
        const existingFiles: string[] = [];
        function scanDirectory(dirPath: string, relativePath: string = '') {
            if (!fs.existsSync(dirPath)) return;
            
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const relativeFilePath = relativePath ? `${relativePath}/${item}` : item;
                
                if (fs.statSync(fullPath).isDirectory()) {
                    scanDirectory(fullPath, relativeFilePath);
                } else {
                    existingFiles.push(relativeFilePath);
                }
            }
        }
        
        scanDirectory(ecsDir);
        
        return {
            templateExists: existingFiles.length > 0,
            existingFiles
        };
    } catch (error) {
        console.error('Error checking ECS template status:', error);
        return {
            templateExists: false,
            existingFiles: []
        };
    }
}

/**
 * 获取ECS框架的最新版本
 */
function getLatestEcsVersion(): Promise<string | null> {
    return new Promise((resolve) => {
        exec('npm view @esengine/ecs-framework version', (error, stdout) => {
            if (error) {
                console.warn('Failed to get latest version:', error);
                resolve(null);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

/**
 * 获取Node.js版本
 */
function getNodeVersion(): Promise<string> {
    return new Promise((resolve) => {
        exec('node --version', (error, stdout) => {
            if (error) {
                resolve('未知');
            } else {
                resolve(stdout.trim().replace('v', ''));
            }
        });
    });
}

/**
 * 比较版本号
 */
function compareVersions(current: string, latest: string): boolean {
    try {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);
        
        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const latestPart = latestParts[i] || 0;
            
            if (latestPart > currentPart) {
                return true; // 有更新
            } else if (latestPart < currentPart) {
                return false; // 当前版本更新
            }
        }
        return false; // 版本相同
    } catch (error) {
        console.warn('Version comparison failed:', error);
        return false;
    }
}

/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }

module.exports = Editor.Panel.define({
    listeners: {
        show() { console.log('ECS Welcome Panel Show'); },
        hide() { console.log('ECS Welcome Panel Hide'); },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
    },
    methods: {
        /**
         * 向主进程发送消息的方法
         */
        sendToMain(message: string, ...args: any[]) {
            Editor.Message.send('cocos-ecs-extension', message, ...args);
        }
    },
    ready() {
        if (this.$.app) {
            const app = createApp({});
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
           
            // ECS欢迎组件
            app.component('EcsWelcome', defineComponent({
                setup() {
                    // 响应式状态
                    const checkingStatus = ref(true);
                    const ecsInstalled = ref(false);
                    const ecsVersion = ref<string | null>(null);
                    const latestVersion = ref<string | null>(null);
                    const hasUpdate = ref(false);
                    const packageJsonExists = ref(false);
                    const nodeVersion = ref('检测中...');
                    const pluginVersion = ref('1.0.0');
                    const lastCheckTime = ref<string | null>(null);
                    
                    // ECS模板状态
                    const templateExists = ref(false);
                    const existingFiles = ref<string[]>([]);
                    
                    // 操作状态
                    const installing = ref(false);
                    const updating = ref(false);
                    const uninstalling = ref(false);
                    
                    // 操作状态显示
                    const showOperationStatus = ref(false);
                    const operationStatusType = ref('loading');
                    const operationStatusMessage = ref('');
                    const operationStatusDetails = ref('');

                    // 显示操作状态
                    const setOperationStatus = (type: string, message: string, details?: string) => {
                        showOperationStatus.value = true;
                        operationStatusType.value = type;
                        operationStatusMessage.value = message;
                        operationStatusDetails.value = details || '';
                        
                        // 自动隐藏成功和警告消息
                        if (type === 'success' || type === 'warning') {
                            setTimeout(() => {
                                showOperationStatus.value = false;
                            }, 5000);
                        }
                    };

                    // 获取状态图标
                    const getStatusIcon = (type: string) => {
                        switch (type) {
                            case 'loading': return '⏳';
                            case 'success': return '✅';
                            case 'error':
                            case 'failed': return '❌';
                            case 'warning': return '⚠️';
                            default: return 'ℹ️';
                        }
                    };

                    // 监听来自主进程的消息 - 暂时注释掉，使用定时刷新
                    const setupMessageListeners = () => {
                        // TODO: 使用正确的消息监听API
                        console.log('Message listeners setup - using polling instead');
                    };

                    // 定时检查状态（用于检测操作完成）
                    let statusCheckInterval: any = null;
                    const startStatusPolling = () => {
                        if (statusCheckInterval) clearInterval(statusCheckInterval);
                        statusCheckInterval = setInterval(() => {
                            if (installing.value || updating.value || uninstalling.value) {
                                checkStatus();
                            }
                        }, 3000); // 每3秒检查一次
                    };

                    const stopStatusPolling = () => {
                        if (statusCheckInterval) {
                            clearInterval(statusCheckInterval);
                            statusCheckInterval = null;
                        }
                    };

                    // 检测状态的方法
                    const checkStatus = async () => {
                        checkingStatus.value = true;
                        
                        try {
                            // 获取当前项目路径
                            const projectPath = Editor.Project.path;
                            
                            // 检测ECS框架状态
                            const status = await checkEcsFrameworkStatus(projectPath);
                            const prevInstalled = ecsInstalled.value;
                            const prevVersion = ecsVersion.value;
                            
                            packageJsonExists.value = status.packageJsonExists;
                            ecsInstalled.value = status.ecsInstalled;
                            ecsVersion.value = status.ecsVersion;
                            
                            // 检测ECS模板状态
                            const templateStatus = checkEcsTemplateStatus(projectPath);
                            templateExists.value = templateStatus.templateExists;
                            existingFiles.value = templateStatus.existingFiles;
                            
                            // 检测操作完成
                            if (installing.value) {
                                if (status.ecsInstalled && !prevInstalled) {
                                    installing.value = false;
                                    setOperationStatus('success', 'ECS Framework 安装成功！');
                                    stopStatusPolling();
                                } else if (!status.ecsInstalled) {
                                    // 可能还在安装中，继续等待
                                }
                            }
                            
                            if (updating.value) {
                                if (status.ecsVersion && status.ecsVersion !== prevVersion) {
                                    updating.value = false;
                                    setOperationStatus('success', `ECS Framework 更新成功到 v${status.ecsVersion}！`);
                                    stopStatusPolling();
                                }
                            }
                            
                            if (uninstalling.value) {
                                if (!status.ecsInstalled && prevInstalled) {
                                    uninstalling.value = false;
                                    setOperationStatus('success', 'ECS Framework 卸载成功！');
                                    stopStatusPolling();
                                }
                            }
                            
                            // 获取Node.js版本
                            nodeVersion.value = await getNodeVersion();
                            
                            // 检查更新
                            if (ecsInstalled.value && ecsVersion.value) {
                                await checkForUpdates();
                            }
                            
                            // 更新检查时间
                            lastCheckTime.value = new Date().toLocaleString();
                            
                        } catch (error) {
                            console.error('Status check failed:', error);
                            
                            // 如果检查失败，停止操作状态
                            if (installing.value || updating.value || uninstalling.value) {
                                installing.value = false;
                                updating.value = false;
                                uninstalling.value = false;
                                setOperationStatus('error', '状态检查失败，请手动验证操作结果');
                                stopStatusPolling();
                            }
                        } finally {
                            checkingStatus.value = false;
                        }
                    };

                    // 检查更新
                    const checkForUpdates = async () => {
                        if (!ecsInstalled.value || !ecsVersion.value) {
                            setOperationStatus('warning', '请先安装 ECS Framework');
                            return;
                        }

                        try {
                            setOperationStatus('loading', '正在检查更新...');
                            
                            const latest = await getLatestEcsVersion();
                            if (latest) {
                                latestVersion.value = latest;
                                const needsUpdate = compareVersions(ecsVersion.value, latest);
                                hasUpdate.value = needsUpdate;
                                
                                if (needsUpdate) {
                                    setOperationStatus('success', `发现新版本：v${latest}（当前：v${ecsVersion.value}）`);
                                } else {
                                    setOperationStatus('success', `已是最新版本：v${ecsVersion.value}`);
                                }
                            } else {
                                setOperationStatus('warning', '无法获取最新版本信息，请检查网络连接');
                            }
                            
                            // 更新检查时间
                            lastCheckTime.value = new Date().toLocaleString();
                            
                        } catch (error) {
                            console.warn('Failed to check updates:', error);
                            setOperationStatus('error', '检查更新失败，请检查网络连接');
                        }
                    };

                    // 操作方法
                    const installEcsFramework = () => {
                        if (!packageJsonExists.value || installing.value) return;
                        
                        Editor.Dialog.info('安装 ECS Framework', {
                            detail: '即将安装@esengine/ecs-framework到当前项目...',
                            buttons: ['确定', '取消'],
                            default: 0,
                        }).then((result) => {
                            if (result.response === 0) {
                                installing.value = true;
                                setOperationStatus('loading', '正在安装 ECS Framework...');
                                startStatusPolling();
                                
                                // 发送安装命令到主进程
                                Editor.Message.send('cocos-ecs-extension', 'install-ecs-framework');
                            }
                        });
                    };

                    const updateEcsFramework = () => {
                        if (!hasUpdate.value || updating.value) return;
                        
                        Editor.Dialog.info('更新 ECS Framework', {
                            detail: `即将更新ECS框架从 v${ecsVersion.value} 到 v${latestVersion.value}`,
                            buttons: ['确定', '取消'],
                            default: 0,
                        }).then((result) => {
                            if (result.response === 0) {
                                updating.value = true;
                                setOperationStatus('loading', `正在更新 ECS Framework 到 v${latestVersion.value}...`);
                                startStatusPolling();
                                
                                Editor.Message.send('cocos-ecs-extension', 'update-ecs-framework', latestVersion.value);
                            }
                        });
                    };

                    const uninstallEcsFramework = () => {
                        if (uninstalling.value) return;
                        
                        Editor.Dialog.warn('卸载 ECS Framework', {
                            detail: '确定要卸载ECS框架吗？这将删除项目中的ECS框架依赖。',
                            buttons: ['确定卸载', '取消'],
                            default: 1,
                        }).then((result) => {
                            if (result.response === 0) {
                                uninstalling.value = true;
                                setOperationStatus('loading', '正在卸载 ECS Framework...');
                                startStatusPolling();
                                
                                Editor.Message.send('cocos-ecs-extension', 'uninstall-ecs-framework');
                            }
                        });
                    };

                    const openDocumentation = () => {
                        if (!ecsInstalled.value) return;
                        Editor.Message.send('cocos-ecs-extension', 'open-documentation');
                    };

                    const createEcsTemplate = () => {
                        if (!ecsInstalled.value || templateExists.value) return;
                        
                        Editor.Dialog.info('创建 ECS 模板', {
                            detail: '即将创建基础的ECS项目结构和启动代码...',
                            buttons: ['确定', '取消'],
                            default: 0,
                        }).then((result) => {
                            if (result.response === 0) {
                                Editor.Message.send('cocos-ecs-extension', 'create-ecs-template');
                            }
                        });
                    };

                    const openGithub = () => {
                        Editor.Message.send('cocos-ecs-extension', 'open-github');
                    };

                    const joinQQGroup = () => {
                        Editor.Message.send('cocos-ecs-extension', 'open-qq-group');
                    };

                    const openGenerator = () => {
                        Editor.Message.send('cocos-ecs-extension', 'open-generator');
                    };

                    // 组件挂载后检测状态
                    onMounted(() => {
                        setupMessageListeners();
                        checkStatus();
                    });

                    return {
                        checkingStatus,
                        ecsInstalled,
                        ecsVersion,
                        latestVersion,
                        hasUpdate,
                        packageJsonExists,
                        nodeVersion,
                        pluginVersion,
                        lastCheckTime,
                        templateExists,
                        existingFiles,
                        installing,
                        updating,
                        uninstalling,
                        showOperationStatus,
                        operationStatusType,
                        operationStatusMessage,
                        operationStatusDetails,
                        getStatusIcon,
                        installEcsFramework,
                        updateEcsFramework,
                        uninstallEcsFramework,
                        checkForUpdates,
                        openDocumentation,
                        createEcsTemplate,
                        openGithub,
                        joinQQGroup,
                        openGenerator
                    };
                },
                template: readFileSync(join(__dirname, '../../../static/template/vue/welcome.html'), 'utf-8'),
            }));

            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});

export function onAssetMenu(assetInfo: any) {
    console.log('[AssetMenu] onAssetMenu 被调用，资源信息:', assetInfo);
    console.log('[AssetMenu] assetInfo 完整结构:', JSON.stringify(assetInfo, null, 2));
    
    const menuItems = [];
    
    // 检查是否为行为树文件
    const isTargetFile = (assetInfo && assetInfo.name && assetInfo.name.endsWith('.bt.json')) ||
                        (assetInfo && assetInfo.file && assetInfo.file.endsWith('.bt.json'));
    
    if (isTargetFile) {
        console.log('[AssetMenu] 发现 .bt.json 文件，添加菜单项');
        menuItems.push({
            label: '用行为树编辑器打开',
            click() {
                console.log('[AssetMenu] 菜单项被点击，文件信息:', assetInfo);
                
                // 直接调用主进程的方法，不需要复杂的序列化
                try {
                    Editor.Message.send('cocos-ecs-extension', 'load-behavior-tree-file', assetInfo);
                    console.log('[AssetMenu] 消息发送成功');
                } catch (error) {
                    console.error('[AssetMenu] 消息发送失败:', error);
                }
            }
        });
    }
    
    // 在目录中添加创建选项
    if (assetInfo && assetInfo.isDirectory) {
        menuItems.push({
            label: '创建行为树文件',
            click() {
                console.log('[AssetMenu] 在目录中创建行为树文件:', assetInfo);
                try {
                    Editor.Message.send('cocos-ecs-extension', 'create-behavior-tree-file');
                } catch (error) {
                    console.error('[AssetMenu] 创建消息发送失败:', error);
                }
            }
        });
    }
    
    console.log('[AssetMenu] 返回菜单项数量:', menuItems.length);
    return menuItems;
} 
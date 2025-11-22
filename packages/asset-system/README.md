# Asset System / 资产系统

A comprehensive asset management system for the ECS Framework.
ECS框架的综合资产管理系统。

## Features / 特性

- **Lazy Loading** / 懒加载 - Assets are loaded only when needed
- **Reference Counting** / 引用计数 - Automatic memory management
- **Memory Budget** / 内存预算 - Control memory usage with configurable limits
- **Asset Bundles** / 资产包 - Group related assets for efficient loading
- **Hot Reload** / 热重载 - Support for runtime asset updates
- **Multiple Loaders** / 多种加载器 - Built-in support for textures, JSON, text, and binary
- **Dependency Management** / 依赖管理 - Automatic loading of asset dependencies
- **Platform Variants** / 平台变体 - Different assets for different platforms
- **Quality Levels** / 质量级别 - Support for multiple quality settings

## Installation / 安装

```bash
npm install @esengine/asset-system
```

## Basic Usage / 基本用法

### Initialize Asset Manager / 初始化资产管理器

```typescript
import { AssetManager, AssetType } from '@esengine/asset-system';

// Create asset manager
const assetManager = new AssetManager();

// Set memory budget (optional)
assetManager.setMemoryBudget({
    maxTotalMemory: 512 * 1024 * 1024, // 512MB
    maxTextureMemory: 256 * 1024 * 1024,
    maxMeshMemory: 128 * 1024 * 1024,
    maxAudioMemory: 64 * 1024 * 1024,
    evictionPolicy: 'lru'
});
```

### Load Assets / 加载资产

```typescript
// Load by path
const result = await assetManager.loadAssetByPath('/assets/textures/player.png');
const texture = result.asset;

// Load by GUID
const result2 = await assetManager.loadAsset('550e8400-e29b-41d4-a716-446655440000');
```

### Using Asset References / 使用资产引用

```typescript
import { AssetReference } from '@esengine/asset-system';

// Create a reference
const textureRef = new AssetReference('texture-guid', assetManager);

// Load when needed
const texture = await textureRef.loadAsync();

// Check if loaded
if (textureRef.isLoaded) {
    const asset = textureRef.asset;
}

// Release when done
textureRef.release();
```

### Batch Loading / 批量加载

```typescript
// Load multiple assets
const guids = ['guid1', 'guid2', 'guid3'];
const results = await assetManager.loadAssets(guids);

// Preload a group
const preloadGroup = {
    name: 'level1',
    assets: ['texture1', 'texture2', 'sound1'],
    priority: 100,
    required: true
};

await assetManager.preloadGroup(preloadGroup, (progress) => {
    console.log(`Loading: ${progress.progress * 100}%`);
});
```

## Custom Loaders / 自定义加载器

```typescript
import { IAssetLoader, AssetType } from '@esengine/asset-system';

class CustomLoader implements IAssetLoader {
    readonly supportedType = AssetType.Custom;
    readonly supportedExtensions = ['.custom'];

    async load(path, metadata, options) {
        // Your loading logic
        const data = await fetch(path);
        return {
            asset: data,
            handle: 0,
            metadata,
            loadTime: 0
        };
    }

    canLoad(path, metadata) {
        return path.endsWith('.custom');
    }

    estimateMemoryUsage(metadata) {
        return metadata.size;
    }

    dispose(asset) {
        // Cleanup
    }
}

// Register custom loader
assetManager.registerLoader(AssetType.Custom, new CustomLoader());
```

## Integration with Sprite Component / 与精灵组件集成

```typescript
import { SpriteComponent } from '@esengine/components';
import { AssetReference } from '@esengine/asset-system';

// Create sprite with asset reference
const sprite = new SpriteComponent();
const textureRef = new AssetReference('texture-guid', assetManager);

sprite.setAssetReference(textureRef);
await sprite.loadTextureAsync();
```

## Engine Integration / 引擎集成

```typescript
import { EngineIntegration } from '@esengine/asset-system';

// Create integration
const integration = new EngineIntegration(assetManager, engineBridge);

// Load texture for component
const textureId = await integration.loadTextureForComponent('/assets/player.png');

// Batch load textures
const texturePaths = ['/assets/bg.png', '/assets/enemy.png'];
const textureIds = await integration.loadTexturesBatch(texturePaths);
```

## Asset Database / 资产数据库

```typescript
// Search assets
const textures = assetManager.database.findAssetsByType(AssetType.Texture);

// Search with query
const results = assetManager.database.searchAssets({
    name: 'player',
    type: AssetType.Texture,
    labels: ['character', 'sprite']
});

// Check dependencies
const dependencies = assetManager.database.getDependencies('asset-guid');
```

## Memory Management / 内存管理

```typescript
// Get memory usage
const usage = assetManager.getMemoryUsage();
console.log(`Total: ${usage.total}, Texture: ${usage.texture}`);

// Unload unused assets
assetManager.unloadUnusedAssets();

// Clear cache
assetManager.clearCache();

// Get statistics
const stats = assetManager.getStatistics();
console.log(`Loaded: ${stats.loadedCount}, Memory: ${stats.totalMemory}`);
```

## Asset Catalog / 资产目录

```typescript
// Create catalog
const catalog = {
    version: '1.0.0',
    createdAt: Date.now(),
    entries: new Map([
        ['texture-guid', {
            guid: 'texture-guid',
            path: '/assets/player.png',
            type: AssetType.Texture,
            size: 1024,
            hash: 'abc123'
        }]
    ]),
    bundles: new Map()
};

// Initialize with catalog
const assetManager = new AssetManager(catalog);
```

## Best Practices / 最佳实践

1. **Use Asset References** / 使用资产引用
   - Use `AssetReference` for lazy loading
   - Release references when not needed

2. **Set Memory Budgets** / 设置内存预算
   - Configure appropriate memory limits
   - Choose the right eviction policy

3. **Batch Load** / 批量加载
   - Load related assets together
   - Use preload groups for levels/scenes

4. **Handle Errors** / 错误处理
   - Always catch loading errors
   - Provide fallback assets

5. **Clean Up** / 清理
   - Release unused assets
   - Clear cache when switching scenes

## API Reference / API参考

See the TypeScript definitions for complete API documentation.
查看TypeScript定义以获取完整的API文档。

## License / 许可证

MIT
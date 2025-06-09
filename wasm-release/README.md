# ECS Framework WASM 支持包

这个包包含了 @esengine/ecs-framework 的 WASM 加速模块。

## 包含文件

- `ecs_wasm_core.js` - WASM 胶水代码
- `ecs_wasm_core.d.ts` - TypeScript 类型定义
- `ecs_wasm_core_bg.wasm` - WASM 二进制文件
- `ecs_wasm_core_bg.wasm.d.ts` - WASM 类型定义
- `package.json` - 包信息

## 使用方法

### Node.js 环境

```javascript
import init, { EcsCore } from './ecs_wasm_core.js';

async function useWasm() {
    // 初始化 WASM 模块
    await init();
    
    // 创建 ECS 核心实例
    const ecsCore = new EcsCore();
    
    // 使用 WASM 加速的 ECS 功能
    const entity = ecsCore.create_entity();
    console.log('创建实体:', entity);
}

useWasm();
```

### 浏览器环境

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import init, { EcsCore } from './ecs_wasm_core.js';
        
        async function main() {
            await init();
            const ecsCore = new EcsCore();
            const entity = ecsCore.create_entity();
            console.log('Entity created:', entity);
        }
        
        main();
    </script>
</head>
<body>
    <h1>ECS Framework WASM Demo</h1>
</body>
</html>
```

### TypeScript 支持

确保包含类型定义：

```typescript
import init, { EcsCore } from './ecs_wasm_core.js';

async function typedExample(): Promise<void> {
    await init();
    
    const ecsCore = new EcsCore();
    const entityId: number = ecsCore.create_entity();
    
    // 使用类型安全的 API
    const mask = BigInt(0b1010);
    ecsCore.update_entity_mask(entityId, mask);
}
```

## 性能优势

WASM 模块主要优化以下操作：

- 🚀 实体查询（10-100x 性能提升）
- 🔥 组件掩码操作
- ⚡ 批量实体处理

## 兼容性

- **浏览器**: 支持 WebAssembly 的现代浏览器
- **Node.js**: 16.0+ 版本
- **TypeScript**: 4.0+ 版本

## 许可证

MIT License - 详见 LICENSE 文件

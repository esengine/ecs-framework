import { defineConfig } from 'tsup';
import { STANDARD_EXTERNALS } from '../build-config/src/types';

// Physics-rapier2d keeps runtime entry for WASM loading
// Chunks are shared between index and runtime entries
// 保留 chunk 分割，index 和 runtime 入口共享代码
export default defineConfig({
    entry: {
        index: 'src/index.ts',
        runtime: 'src/runtime.ts'
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    tsconfig: 'tsconfig.build.json',
    // 使用标准外部依赖列表，确保所有 @esengine/* 包都被外部化
    // 这避免了类被重复打包导致 instanceof 检查失败的问题
    external: [
        ...STANDARD_EXTERNALS,
    ],
    esbuildOptions(options) {
        options.jsx = 'automatic';
    }
});

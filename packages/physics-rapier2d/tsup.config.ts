import { defineConfig } from 'tsup';
import { STANDARD_EXTERNALS } from '../build-config/src/types';

// Physics-rapier2d keeps runtime entry for WASM loading
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

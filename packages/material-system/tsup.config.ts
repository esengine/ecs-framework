import { defineConfig } from 'tsup';
import { runtimeOnlyPreset } from '../build-config/src/presets/plugin-tsup';

export default defineConfig({
    ...runtimeOnlyPreset(),
    tsconfig: 'tsconfig.build.json'
});

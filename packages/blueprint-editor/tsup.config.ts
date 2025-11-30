import { defineConfig } from 'tsup';
import { editorOnlyPreset } from '../build-config/src/presets/plugin-tsup';

export default defineConfig({
    ...editorOnlyPreset(),
    tsconfig: 'tsconfig.build.json'
});

/**
 * 粒子编辑器模块入口
 * Particle Editor Module Entry
 */

// Module
export {
    ParticleEditorModule,
    particleEditorModule,
    ParticlePlugin,
    particleEditorModule as default
} from './ParticleEditorModule';

// Providers
export { ParticleInspectorProvider } from './providers/ParticleInspectorProvider';

// Panels
export { ParticleEditorPanel } from './panels/ParticleEditorPanel';

// Stores
export { useParticleEditorStore } from './stores/ParticleEditorStore';
export type { ParticleEditorState } from './stores/ParticleEditorStore';

// Components
export { GradientEditor, CurveEditor } from './components';

// Gizmos
export { registerParticleGizmo, unregisterParticleGizmo } from './gizmos/ParticleGizmo';

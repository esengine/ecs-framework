/**
 * Camera System
 * 相机系统
 */

import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import type { IEngineBridge } from '@esengine/engine-core';
import { CameraComponent } from './CameraComponent';

@ECSSystem('Camera', { updateOrder: -100 })
export class CameraSystem extends EntitySystem {
    private bridge: IEngineBridge;
    private lastAppliedCameraId: number | null = null;

    constructor(bridge: IEngineBridge) {
        // Match entities with CameraComponent
        super(Matcher.empty().all(CameraComponent));
        this.bridge = bridge;
    }

    protected override onBegin(): void {
        // Will process cameras in process()
    }

    protected override process(entities: readonly Entity[]): void {
        // Use first enabled camera
        for (const entity of entities) {
            if (!entity.enabled) continue;

            const camera = entity.getComponent(CameraComponent);
            if (!camera) continue;

            // Only apply if camera changed
            if (this.lastAppliedCameraId !== entity.id) {
                this.applyCamera(camera);
                this.lastAppliedCameraId = entity.id;
            }

            // Only use first active camera
            break;
        }
    }

    private applyCamera(camera: CameraComponent): void {
        // Apply background color
        const bgColor = camera.backgroundColor || '#000000';
        const r = parseInt(bgColor.slice(1, 3), 16) / 255;
        const g = parseInt(bgColor.slice(3, 5), 16) / 255;
        const b = parseInt(bgColor.slice(5, 7), 16) / 255;
        this.bridge.setClearColor(r, g, b, 1.0);
    }
}

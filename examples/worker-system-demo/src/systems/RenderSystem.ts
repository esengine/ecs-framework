import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { Position, Renderable } from '../components';

@ECSSystem('RenderSystem')
export class RenderSystem extends EntitySystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private startTime: number = 0;
    private batchCount: number = 0;
    private drawCallCount: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        super(Matcher.empty().all(Position, Renderable));
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    protected override onBegin(): void {
        super.onBegin();
        this.startTime = performance.now();

        // 清空画布
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    protected override process(entities: readonly Entity[]): void {
        // 保持原始绘制顺序，但优化连续相同颜色的绘制
        let lastColor = '';
        this.drawCallCount = 0;

        for (const entity of entities) {
            const position = entity.getComponent(Position)!;
            const renderable = entity.getComponent(Renderable)!;

            // 只在颜色变化时设置fillStyle，减少状态切换
            if (renderable.color !== lastColor) {
                this.ctx.fillStyle = renderable.color;
                lastColor = renderable.color;
            }

            if (renderable.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(position.x, position.y, renderable.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.drawCallCount++;
            } else if (renderable.shape === 'square') {
                this.ctx.fillRect(
                    position.x - renderable.size / 2,
                    position.y - renderable.size / 2,
                    renderable.size,
                    renderable.size
                );
                this.drawCallCount++;
            }
        }

        // 计算颜色多样性用于显示
        const uniqueColors = new Set(entities.map(e => e.getComponent(Renderable)!.color));
        this.batchCount = uniqueColors.size;
    }

    protected override onEnd(): void {
        super.onEnd();
        const endTime = performance.now();
        const executionTime = endTime - this.startTime;

        // 发送性能数据到UI
        (window as any).renderExecutionTime = executionTime;

        // 绘制调试信息
        this.drawDebugInfo();
    }

    private drawDebugInfo(): void {
        const entities = this.entities;

        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`实体数量: ${entities.length}`, 10, 20);
        this.ctx.fillText(`渲染批次: ${this.batchCount}`, 10, 140);
        this.ctx.fillText(`绘制调用: ${this.drawCallCount}`, 10, 160);

        const workerInfo = (window as any).workerInfo;
        if (workerInfo) {
            this.ctx.fillStyle = workerInfo.enabled ? '#00ff00' : '#ff0000';
            this.ctx.fillText(`Worker: ${workerInfo.enabled ? '启用' : '禁用'}`, 10, 40);

            if (workerInfo.enabled) {
                this.ctx.fillStyle = '#ffff00';
                const entitiesPerWorker = Math.ceil(entities.length / workerInfo.workerCount);
                this.ctx.fillText(`每个Worker实体: ${entitiesPerWorker}`, 10, 60);
                this.ctx.fillText(`Worker数量: ${workerInfo.workerCount}`, 10, 80);
            }
        }

        // 显示性能信息
        const physicsTime = (window as any).physicsExecutionTime || 0;
        const renderTime = (window as any).renderExecutionTime || 0;

        this.ctx.fillStyle = physicsTime > 16 ? '#ff0000' : physicsTime > 8 ? '#ffff00' : '#00ff00';
        this.ctx.fillText(`物理: ${physicsTime.toFixed(2)}ms`, 10, 100);

        this.ctx.fillStyle = renderTime > 16 ? '#ff0000' : renderTime > 8 ? '#ffff00' : '#00ff00';
        this.ctx.fillText(`渲染: ${renderTime.toFixed(2)}ms`, 10, 120);
    }
}
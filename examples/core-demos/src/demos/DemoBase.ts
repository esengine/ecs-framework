import { Scene, Core } from '@esengine/esengine';

export interface DemoInfo {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
}

export abstract class DemoBase {
    protected scene: Scene;
    protected canvas: HTMLCanvasElement;
    protected ctx: CanvasRenderingContext2D;
    protected controlPanel: HTMLElement;
    protected isRunning: boolean = false;
    protected animationFrameId: number | null = null;
    protected lastTime: number = 0;

    constructor(canvas: HTMLCanvasElement, controlPanel: HTMLElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.controlPanel = controlPanel;
        this.scene = new Scene({ name: this.getInfo().name });

        // 设置canvas大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    abstract getInfo(): DemoInfo;
    abstract setup(): void;
    abstract createControls(): void;

    protected resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();

        // 设置当前场景到Core
        Core.setScene(this.scene);

        this.scene.begin();
        this.loop();
    }

    public stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    public destroy() {
        this.stop();
        this.scene.end();
    }

    protected loop = () => {
        if (!this.isRunning) return;

        // 计算deltaTime
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
        this.lastTime = currentTime;

        // 更新ECS框架
        Core.update(deltaTime);

        // 渲染
        this.render();

        // 继续循环
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    protected abstract render(): void;

    protected showToast(message: string, icon: string = '✅') {
        const toast = document.getElementById('toast')!;
        const toastMessage = document.getElementById('toastMessage')!;
        const toastIcon = toast.querySelector('.toast-icon')!;

        toastIcon.textContent = icon;
        toastMessage.textContent = message;

        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

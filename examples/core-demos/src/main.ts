import { DEMO_REGISTRY, DemoBase } from './demos';
import { Core } from '@esengine/ecs-framework';

class DemoManager {
    private demos: Map<string, typeof DemoBase> = new Map();
    private currentDemo: DemoBase | null = null;
    private canvas: HTMLCanvasElement;
    private controlPanel: HTMLElement;

    constructor() {
        // 初始化ECS Core
        Core.create({
            debug: true,
            enableEntitySystems: true
        });

        this.canvas = document.getElementById('demoCanvas') as HTMLCanvasElement;
        this.controlPanel = document.getElementById('controlPanel') as HTMLElement;

        // 注册所有demos
        for (const DemoClass of DEMO_REGISTRY) {
            const tempInstance = new DemoClass(this.canvas, this.controlPanel);
            const info = tempInstance.getInfo();
            this.demos.set(info.id, DemoClass);
            tempInstance.destroy();
        }

        // 渲染demo列表
        this.renderDemoList();

        // 自动加载第一个demo
        const firstDemo = DEMO_REGISTRY[0];
        if (firstDemo) {
            const tempInstance = new firstDemo(this.canvas, this.controlPanel);
            const info = tempInstance.getInfo();
            tempInstance.destroy();
            this.loadDemo(info.id);
        }
    }

    private renderDemoList() {
        const demoList = document.getElementById('demoList')!;

        // 按分类组织demos
        const categories = new Map<string, typeof DemoBase[]>();

        for (const DemoClass of DEMO_REGISTRY) {
            const tempInstance = new DemoClass(this.canvas, this.controlPanel);
            const info = tempInstance.getInfo();
            tempInstance.destroy();

            if (!categories.has(info.category)) {
                categories.set(info.category, []);
            }
            categories.get(info.category)!.push(DemoClass);
        }

        // 渲染分类和demos
        let html = '';
        for (const [category, demoClasses] of categories) {
            html += `<div class="demo-category">`;
            html += `<div class="category-title">${category}</div>`;

            for (const DemoClass of demoClasses) {
                const tempInstance = new DemoClass(this.canvas, this.controlPanel);
                const info = tempInstance.getInfo();
                tempInstance.destroy();

                html += `
                    <div class="demo-item" data-demo-id="${info.id}">
                        <div class="demo-icon">${info.icon}</div>
                        <div class="demo-info">
                            <div class="demo-name">${info.name}</div>
                            <div class="demo-desc">${info.description}</div>
                        </div>
                    </div>
                `;
            }

            html += `</div>`;
        }

        demoList.innerHTML = html;

        // 绑定点击事件
        demoList.querySelectorAll('.demo-item').forEach(item => {
            item.addEventListener('click', () => {
                const demoId = item.getAttribute('data-demo-id')!;
                this.loadDemo(demoId);
            });
        });
    }

    private loadDemo(demoId: string) {
        // 停止并销毁当前demo
        if (this.currentDemo) {
            this.currentDemo.destroy();
            this.currentDemo = null;
        }

        // 显示加载动画
        const loading = document.getElementById('loading')!;
        loading.style.display = 'block';

        // 延迟加载，给用户反馈
        setTimeout(() => {
            const DemoClass = this.demos.get(demoId);
            if (!DemoClass) {
                console.error(`Demo ${demoId} not found`);
                loading.style.display = 'none';
                return;
            }

            try {
                // 创建新demo
                this.currentDemo = new DemoClass(this.canvas, this.controlPanel);
                const info = this.currentDemo.getInfo();

                // 更新页面标题和描述
                document.getElementById('demoTitle')!.textContent = info.name;
                document.getElementById('demoDescription')!.textContent = info.description;

                // 设置demo
                this.currentDemo.setup();

                // 显示控制面板
                this.controlPanel.style.display = 'block';

                // 启动demo
                this.currentDemo.start();

                // 更新菜单选中状态
                document.querySelectorAll('.demo-item').forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('data-demo-id') === demoId) {
                        item.classList.add('active');
                    }
                });

                loading.style.display = 'none';

                console.log(`✅ Demo "${info.name}" loaded successfully`);
            } catch (error) {
                console.error(`Failed to load demo ${demoId}:`, error);
                loading.style.display = 'none';
                this.showError('加载演示失败：' + (error as Error).message);
            }
        }, 300);
    }

    private showError(message: string) {
        const toast = document.getElementById('toast')!;
        const toastMessage = document.getElementById('toastMessage')!;
        const toastIcon = toast.querySelector('.toast-icon')!;

        toastIcon.textContent = '❌';
        toastMessage.textContent = message;
        toast.style.borderColor = '#f5576c';

        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            toast.style.borderColor = '#667eea';
        }, 3000);
    }
}

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    new DemoManager();
});

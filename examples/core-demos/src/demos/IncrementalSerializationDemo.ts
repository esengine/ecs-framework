import { DemoBase, DemoInfo } from './DemoBase';
import {
    Component,
    ECSComponent,
    Entity,
    EntitySystem,
    Matcher,
    Serializable,
    Serialize,
    IncrementalSerializer
} from '@esengine/esengine';

// ===== 组件定义 =====
@ECSComponent('IncDemo_Position')
@Serializable({ version: 1, typeId: 'IncDemo_Position' })
class PositionComponent extends Component {
    @Serialize() x: number = 0;
    @Serialize() y: number = 0;
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('IncDemo_Velocity')
@Serializable({ version: 1, typeId: 'IncDemo_Velocity' })
class VelocityComponent extends Component {
    @Serialize() vx: number = 0;
    @Serialize() vy: number = 0;
    constructor(vx: number = 0, vy: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
    }
}

@ECSComponent('IncDemo_Renderable')
@Serializable({ version: 1, typeId: 'IncDemo_Renderable' })
class RenderableComponent extends Component {
    @Serialize() color: string = '#ffffff';
    @Serialize() radius: number = 10;
    constructor(color: string = '#ffffff', radius: number = 10) {
        super();
        this.color = color;
        this.radius = radius;
    }
}

// ===== 系统定义 =====
class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.all(PositionComponent, VelocityComponent));
    }

    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const [pos, vel] = this.getComponents(entity, PositionComponent, VelocityComponent);

            pos.x += vel.vx;
            pos.y += vel.vy;

            if (pos.x < 0 || pos.x > 1200) vel.vx *= -1;
            if (pos.y < 0 || pos.y > 600) vel.vy *= -1;
        }
    }
}

class RenderSystem extends EntitySystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        super(Matcher.all(PositionComponent, RenderableComponent));
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        this.ctx = ctx;
    }

    protected override process(entities: readonly Entity[]): void {
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const entity of entities) {
            const [pos, render] = this.getComponents(entity, PositionComponent, RenderableComponent);

            this.ctx.fillStyle = render.color;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, render.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'white';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(entity.name, pos.x, pos.y - render.radius - 5);
        }
    }
}

export class IncrementalSerializationDemo extends DemoBase {
    private renderSystem!: RenderSystem;
    private incrementalHistory: any[] = [];
    private autoSnapshotInterval: number | null = null;

    getInfo(): DemoInfo {
        return {
            id: 'incremental-serialization',
            name: '增量序列化',
            description: '演示增量序列化功能，只保存场景变更而非完整状态，适用于网络同步和回放系统',
            category: '核心功能',
            icon: '🔄'
        };
    }

    setup() {
        // 创建控制面板
        this.createControls();

        // 添加系统
        this.renderSystem = new RenderSystem(this.canvas);
        this.scene.addEntityProcessor(new MovementSystem());
        this.scene.addEntityProcessor(this.renderSystem);

        // 创建初始实体
        this.createInitialEntities();

        // 创建基础快照
        this.scene.createIncrementalSnapshot();
        this.addToHistory('Initial State');
    }

    private createInitialEntities() {
        // 创建玩家
        const player = this.scene.createEntity('Player');
        player.addComponent(new PositionComponent(600, 300));
        player.addComponent(new VelocityComponent(2, 1.5));
        player.addComponent(new RenderableComponent('#4a9eff', 15));

        // 设置场景数据
        this.scene.sceneData.set('gameTime', 0);
        this.scene.sceneData.set('score', 0);
    }

    private createRandomEntity() {
        const entity = this.scene.createEntity(`Entity_${Date.now()}`);
        entity.addComponent(new PositionComponent(
            Math.random() * this.canvas.width,
            Math.random() * this.canvas.height
        ));
        entity.addComponent(new VelocityComponent(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3
        ));
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8dadc', '#f1faee'];
        entity.addComponent(new RenderableComponent(
            colors[Math.floor(Math.random() * colors.length)],
            5 + Math.random() * 10
        ));
    }

    private addToHistory(label: string) {
        const incremental = this.scene.serializeIncremental();
        const stats = IncrementalSerializer.getIncrementalStats(incremental);

        // 计算JSON和二进制格式的大小
        const jsonSize = IncrementalSerializer.getIncrementalSize(incremental, 'json');
        const binarySize = IncrementalSerializer.getIncrementalSize(incremental, 'binary');

        this.incrementalHistory.push({
            label,
            incremental,
            stats,
            timestamp: Date.now(),
            jsonSize,
            binarySize
        });

        this.scene.updateIncrementalSnapshot();
        this.updateHistoryPanel();
        this.updateStats();
    }

    createControls() {
        this.controlPanel.innerHTML = `
            <div class="control-section">
                <h4>实体控制</h4>
                <div class="button-group">
                    <button id="addEntity" class="secondary">添加随机实体</button>
                    <button id="removeEntity" class="danger">删除最后一个实体</button>
                    <button id="modifyEntity" class="secondary">修改实体数据</button>
                </div>
            </div>

            <div class="control-section">
                <h4>增量快照</h4>
                <div class="button-group">
                    <button id="captureSnapshot" class="success">捕获当前状态</button>
                    <button id="clearHistory" class="danger">清空历史</button>
                </div>
                <div style="margin-top: 10px;">
                    <label>
                        <input type="checkbox" id="autoSnapshot">
                        自动快照（每2秒）
                    </label>
                </div>
            </div>

            <div class="control-section">
                <h4>场景数据控制</h4>
                <div class="input-group">
                    <label>游戏时间</label>
                    <input type="number" id="gameTime" value="0" step="1">
                </div>
                <div class="input-group">
                    <label>分数</label>
                    <input type="number" id="score" value="0" step="10">
                </div>
                <button id="updateSceneData" class="secondary">更新场景数据</button>
            </div>

            <div class="stats-panel">
                <div class="stat-item">
                    <div class="stat-label">实体数量</div>
                    <div class="stat-value" id="entityCount">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">历史记录</div>
                    <div class="stat-value" id="historyCount">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">JSON大小</div>
                    <div class="stat-value" id="jsonSize">0B</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">二进制大小</div>
                    <div class="stat-value" id="binarySize">0B</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">压缩率</div>
                    <div class="stat-value" id="compressionRatio">0%</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">总变更数</div>
                    <div class="stat-value" id="totalChanges">0</div>
                </div>
            </div>

            <div class="control-section">
                <h4>增量历史 <small style="color: #8892b0;">(点击快照查看详情)</small></h4>
                <div style="max-height: 300px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px;" id="historyPanel">
                    暂无历史记录
                </div>
            </div>

            <div class="control-section">
                <h4>快照详情</h4>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #8892b0;" id="snapshotDetails">
                    点击历史记录查看详情...
                </div>
            </div>
        `;

        this.bindEvents();
        this.updateStats();
    }

    private bindEvents() {
        document.getElementById('addEntity')!.addEventListener('click', () => {
            this.createRandomEntity();
            this.addToHistory('添加实体');
            this.showToast('添加了一个随机实体');
        });

        document.getElementById('removeEntity')!.addEventListener('click', () => {
            const entities = this.scene.entities.buffer;
            if (entities.length > 1) {
                const lastEntity = entities[entities.length - 1];
                lastEntity.destroy();
                this.addToHistory('删除实体');
                this.showToast('删除了最后一个实体');
            } else {
                this.showToast('至少保留一个实体', '⚠️');
            }
        });

        document.getElementById('modifyEntity')!.addEventListener('click', () => {
            const entities = this.scene.entities.buffer;
            if (entities.length > 0) {
                const randomEntity = entities[Math.floor(Math.random() * entities.length)];
                const pos = randomEntity.getComponent(PositionComponent);
                if (pos) {
                    pos.x = Math.random() * this.canvas.width;
                    pos.y = Math.random() * this.canvas.height;
                }
                this.addToHistory('修改实体位置');
                this.showToast(`修改了 ${randomEntity.name} 的位置`);
            }
        });

        document.getElementById('captureSnapshot')!.addEventListener('click', () => {
            this.addToHistory('手动快照');
            this.showToast('已捕获当前状态', '📸');
        });

        document.getElementById('clearHistory')!.addEventListener('click', () => {
            this.incrementalHistory = [];
            this.scene.createIncrementalSnapshot();
            this.addToHistory('清空后重新开始');
            this.showToast('历史记录已清空');
        });

        document.getElementById('autoSnapshot')!.addEventListener('change', (e) => {
            const checkbox = e.target as HTMLInputElement;
            if (checkbox.checked) {
                this.autoSnapshotInterval = window.setInterval(() => {
                    this.addToHistory('自动快照');
                }, 2000);
                this.showToast('自动快照已启用', '⏱️');
            } else {
                if (this.autoSnapshotInterval !== null) {
                    clearInterval(this.autoSnapshotInterval);
                    this.autoSnapshotInterval = null;
                }
                this.showToast('自动快照已禁用');
            }
        });

        document.getElementById('updateSceneData')!.addEventListener('click', () => {
            const gameTime = parseInt((document.getElementById('gameTime') as HTMLInputElement).value);
            const score = parseInt((document.getElementById('score') as HTMLInputElement).value);

            this.scene.sceneData.set('gameTime', gameTime);
            this.scene.sceneData.set('score', score);

            this.addToHistory('更新场景数据');
            this.showToast('场景数据已更新');
        });
    }

    private updateHistoryPanel() {
        const panel = document.getElementById('historyPanel')!;

        if (this.incrementalHistory.length === 0) {
            panel.innerHTML = '暂无历史记录';
            return;
        }

        panel.innerHTML = this.incrementalHistory.map((item, index) => {
            const isLatest = index === this.incrementalHistory.length - 1;
            const time = new Date(item.timestamp).toLocaleTimeString();

            return `
                <div class="history-item" data-index="${index}" style="
                    padding: 8px;
                    margin: 4px 0;
                    background: ${isLatest ? 'rgba(74, 158, 255, 0.2)' : 'rgba(136, 146, 176, 0.1)'};
                    border-left: 3px solid ${isLatest ? '#4a9eff' : '#8892b0'};
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.2s;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${item.label}</strong>
                            ${isLatest ? '<span style="color: #4a9eff; margin-left: 8px;">●</span>' : ''}
                        </div>
                        <small style="color: #8892b0;">${time}</small>
                    </div>
                    <div style="font-size: 11px; color: #8892b0; margin-top: 4px;">
                        实体: +${item.stats.addedEntities} -${item.stats.removedEntities} ~${item.stats.updatedEntities} |
                        组件: +${item.stats.addedComponents} -${item.stats.removedComponents} ~${item.stats.updatedComponents}
                    </div>
                    <div style="font-size: 11px; color: #8892b0; margin-top: 2px;">
                        JSON: ${this.formatBytes(item.jsonSize)} |
                        Binary: ${this.formatBytes(item.binarySize)} |
                        <span style="color: #4ecdc4;">节省: ${((1 - item.binarySize / item.jsonSize) * 100).toFixed(1)}%</span>
                    </div>
                </div>
            `;
        }).join('');

        // 绑定点击事件
        panel.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.getAttribute('data-index')!);
                this.showSnapshotDetails(index);
            });
        });

        // 自动滚动到底部
        panel.scrollTop = panel.scrollHeight;
    }

    private showSnapshotDetails(index: number) {
        const item = this.incrementalHistory[index];
        const detailsPanel = document.getElementById('snapshotDetails')!;

        const compressionRatio = ((1 - item.binarySize / item.jsonSize) * 100).toFixed(1);

        const details = {
            版本: item.incremental.version,
            基础版本: item.incremental.baseVersion,
            时间戳: new Date(item.incremental.timestamp).toLocaleString(),
            场景名称: item.incremental.sceneName,
            格式对比: {
                JSON大小: this.formatBytes(item.jsonSize),
                二进制大小: this.formatBytes(item.binarySize),
                压缩率: `${compressionRatio}%`,
                节省字节: this.formatBytes(item.jsonSize - item.binarySize)
            },
            统计: item.stats,
            实体变更: item.incremental.entityChanges.map((c: any) => ({
                操作: c.operation,
                实体ID: c.entityId,
                实体名称: c.entityName
            })),
            组件变更: item.incremental.componentChanges.map((c: any) => ({
                操作: c.operation,
                实体ID: c.entityId,
                组件类型: c.componentType
            })),
            场景数据变更: item.incremental.sceneDataChanges.map((c: any) => ({
                键: c.key,
                值: c.value,
                已删除: c.deleted
            }))
        };

        detailsPanel.textContent = JSON.stringify(details, null, 2);
    }

    private updateStats() {
        document.getElementById('entityCount')!.textContent = this.scene.entities.count.toString();
        document.getElementById('historyCount')!.textContent = this.incrementalHistory.length.toString();

        if (this.incrementalHistory.length > 0) {
            const lastItem = this.incrementalHistory[this.incrementalHistory.length - 1];

            document.getElementById('jsonSize')!.textContent = this.formatBytes(lastItem.jsonSize);
            document.getElementById('binarySize')!.textContent = this.formatBytes(lastItem.binarySize);

            const compressionRatio = ((1 - lastItem.binarySize / lastItem.jsonSize) * 100).toFixed(1);
            const ratioElement = document.getElementById('compressionRatio')!;
            ratioElement.textContent = `${compressionRatio}%`;
            ratioElement.style.color = parseFloat(compressionRatio) > 30 ? '#4ecdc4' : '#ffe66d';

            document.getElementById('totalChanges')!.textContent = lastItem.stats.totalChanges.toString();
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }

    protected render() {
        // RenderSystem会处理渲染
    }

    public destroy() {
        if (this.autoSnapshotInterval !== null) {
            clearInterval(this.autoSnapshotInterval);
        }
        super.destroy();
    }
}

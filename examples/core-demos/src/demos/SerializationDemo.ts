import { DemoBase, DemoInfo } from './DemoBase';
import {
    Component,
    ECSComponent,
    Entity,
    EntitySystem,
    Matcher,
    Serializable,
    Serialize,
    SerializeAsMap
} from '@esengine/esengine';

// ===== 组件定义 =====
@ECSComponent('SerDemo_Position')
@Serializable({ version: 1, typeId: 'SerDemo_Position' })
class PositionComponent extends Component {
    @Serialize() x: number = 0;
    @Serialize() y: number = 0;
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('SerDemo_Velocity')
@Serializable({ version: 1, typeId: 'SerDemo_Velocity' })
class VelocityComponent extends Component {
    @Serialize() vx: number = 0;
    @Serialize() vy: number = 0;
    constructor(vx: number = 0, vy: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
    }
}

@ECSComponent('SerDemo_Renderable')
@Serializable({ version: 1, typeId: 'SerDemo_Renderable' })
class RenderableComponent extends Component {
    @Serialize() color: string = '#ffffff';
    @Serialize() radius: number = 10;
    constructor(color: string = '#ffffff', radius: number = 10) {
        super();
        this.color = color;
        this.radius = radius;
    }
}

@ECSComponent('SerDemo_Player')
@Serializable({ version: 1, typeId: 'SerDemo_Player' })
class PlayerComponent extends Component {
    @Serialize() name: string = 'Player';
    @Serialize() level: number = 1;
    @Serialize() health: number = 100;
    @SerializeAsMap() inventory: Map<string, number> = new Map();
    constructor(name: string = 'Player') {
        super();
        this.name = name;
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

            // 边界反弹
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
        this.ctx = canvas.getContext('2d')!;
    }

    protected override process(entities: readonly Entity[]): void {
        // 清空画布
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 渲染所有实体
        for (const entity of entities) {
            const [pos, render] = this.getComponents(entity, PositionComponent, RenderableComponent);

            this.ctx.fillStyle = render.color;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, render.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 如果是玩家，显示名字
            const player = entity.getComponent(PlayerComponent);
            if (player) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(player.name, pos.x, pos.y - render.radius - 5);
            }
        }
    }
}

export class SerializationDemo extends DemoBase {
    private renderSystem!: RenderSystem;
    private jsonData: string = '';
    private binaryData: Buffer | null = null;

    getInfo(): DemoInfo {
        return {
            id: 'serialization',
            name: '场景序列化',
            description: '演示场景的序列化和反序列化功能，支持JSON和二进制格式',
            category: '核心功能',
            icon: '💾'
        };
    }

    setup() {
        // @ECSComponent装饰器会自动注册组件到ComponentRegistry
        // ComponentRegistry会被序列化系统自动使用，无需手动注册

        // 添加系统
        this.renderSystem = new RenderSystem(this.canvas);
        this.scene.addEntityProcessor(new MovementSystem());
        this.scene.addEntityProcessor(this.renderSystem);

        // 创建初始实体
        this.createInitialEntities();

        // 创建控制面板
        this.createControls();
    }

    private createInitialEntities() {
        // 创建玩家
        const player = this.scene.createEntity('Player');
        player.addComponent(new PositionComponent(600, 300));
        player.addComponent(new VelocityComponent(2, 1.5));
        player.addComponent(new RenderableComponent('#4a9eff', 15));
        const playerComp = new PlayerComponent('Hero');
        playerComp.level = 5;
        playerComp.health = 100;
        playerComp.inventory.set('sword', 1);
        playerComp.inventory.set('potion', 5);
        player.addComponent(playerComp);

        // 创建一些随机实体
        for (let i = 0; i < 5; i++) {
            this.createRandomEntity();
        }

        // 设置场景数据
        this.scene.sceneData.set('weather', 'sunny');
        this.scene.sceneData.set('gameTime', 12.5);
        this.scene.sceneData.set('difficulty', 'normal');
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

    createControls() {
        this.controlPanel.innerHTML = `
            <div class="control-section">
                <h4>实体控制</h4>
                <div class="button-group">
                    <button id="addEntity" class="secondary">添加随机实体</button>
                    <button id="clearEntities" class="danger">清空所有实体</button>
                </div>
            </div>

            <div class="control-section">
                <h4>序列化操作</h4>
                <div class="button-group">
                    <button id="serializeJSON">序列化为JSON</button>
                    <button id="serializeBinary" class="success">序列化为二进制</button>
                    <button id="deserialize" class="secondary">反序列化恢复</button>
                </div>
            </div>

            <div class="control-section">
                <h4>本地存储</h4>
                <div class="button-group">
                    <button id="saveLocal" class="success">保存到LocalStorage</button>
                    <button id="loadLocal" class="secondary">从LocalStorage加载</button>
                </div>
            </div>

            <div class="control-section">
                <h4>场景数据</h4>
                <div class="input-group">
                    <label>天气</label>
                    <input type="text" id="weather" value="sunny" placeholder="sunny/rainy/snowy">
                </div>
                <div class="input-group">
                    <label>游戏时间</label>
                    <input type="number" id="gameTime" value="12.5" step="0.1" min="0" max="24">
                </div>
                <button id="updateSceneData" class="secondary">更新场景数据</button>
            </div>

            <div class="stats-panel">
                <div class="stat-item">
                    <div class="stat-label">实体数量</div>
                    <div class="stat-value" id="entityCount">0</div>
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
            </div>

            <div class="control-section">
                <h4>序列化数据预览</h4>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #8892b0; word-break: break-all;" id="dataPreview">
                    点击序列化按钮查看数据...
                </div>
            </div>
        `;

        // 绑定事件
        this.bindEvents();
    }

    private bindEvents() {
        document.getElementById('addEntity')!.addEventListener('click', () => {
            this.createRandomEntity();
            this.updateStats();
            this.showToast('添加了一个随机实体');
        });

        document.getElementById('clearEntities')!.addEventListener('click', () => {
            this.scene.destroyAllEntities();
            this.createInitialEntities();
            this.updateStats();
            this.showToast('场景已重置');
        });

        document.getElementById('serializeJSON')!.addEventListener('click', () => {
            this.jsonData = this.scene.serialize({ format: 'json', pretty: true }) as string;
            this.updateDataPreview(this.jsonData, 'json');
            this.updateStats();
            this.showToast('已序列化为JSON格式');
        });

        document.getElementById('serializeBinary')!.addEventListener('click', () => {
            this.binaryData = this.scene.serialize({ format: 'binary' }) as Buffer;
            const base64 = this.binaryData.toString('base64');
            this.updateDataPreview(`Binary Data (Base64):\n${base64.substring(0, 500)}...`, 'binary');
            this.updateStats();
            this.showToast('已序列化为二进制格式', '🔐');
        });

        document.getElementById('deserialize')!.addEventListener('click', () => {
            const data = this.binaryData || this.jsonData;
            if (!data) {
                this.showToast('请先执行序列化操作', '⚠️');
                return;
            }

            this.scene.deserialize(data, {
                strategy: 'replace'
                // componentRegistry会自动从ComponentRegistry获取，无需手动传入
            });

            this.updateStats();
            this.showToast('场景已恢复');
        });

        document.getElementById('saveLocal')!.addEventListener('click', () => {
            const jsonData = this.scene.serialize({ format: 'json' }) as string;
            localStorage.setItem('ecs_demo_scene', jsonData);
            this.showToast('已保存到LocalStorage', '💾');
        });

        document.getElementById('loadLocal')!.addEventListener('click', () => {
            const data = localStorage.getItem('ecs_demo_scene');
            if (!data) {
                this.showToast('LocalStorage中没有保存的场景', '⚠️');
                return;
            }

            this.scene.deserialize(data, {
                strategy: 'replace'
                // componentRegistry会自动从ComponentRegistry获取，无需手动传入
            });

            this.updateStats();
            this.showToast('已从LocalStorage加载', '📂');
        });

        document.getElementById('updateSceneData')!.addEventListener('click', () => {
            const weather = (document.getElementById('weather') as HTMLInputElement).value;
            const gameTime = parseFloat((document.getElementById('gameTime') as HTMLInputElement).value);

            this.scene.sceneData.set('weather', weather);
            this.scene.sceneData.set('gameTime', gameTime);

            this.showToast('场景数据已更新');
        });

        // 初始更新统计
        this.updateStats();
    }

    private updateDataPreview(data: string, format: string) {
        const preview = document.getElementById('dataPreview')!;
        if (format === 'json') {
            const truncated = data.length > 1000 ? data.substring(0, 1000) + '\n...(truncated)' : data;
            preview.textContent = truncated;
        } else {
            preview.textContent = data;
        }
    }

    private updateStats() {
        const entityCount = this.scene.entities.count;
        document.getElementById('entityCount')!.textContent = entityCount.toString();

        // 计算JSON大小
        if (this.jsonData) {
            const jsonSize = new Blob([this.jsonData]).size;
            document.getElementById('jsonSize')!.textContent = this.formatBytes(jsonSize);
        }

        // 计算二进制大小
        if (this.binaryData) {
            const binarySize = this.binaryData.length;
            document.getElementById('binarySize')!.textContent = this.formatBytes(binarySize);

            // 计算压缩率
            if (this.jsonData) {
                const jsonSize = new Blob([this.jsonData]).size;
                const ratio = ((1 - binarySize / jsonSize) * 100).toFixed(1);
                document.getElementById('compressionRatio')!.textContent = `${ratio}%`;
            }
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
}

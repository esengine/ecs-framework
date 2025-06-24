import { _decorator, Component, Node, Vec3, instantiate, Prefab, Camera } from 'cc';
import { UnitController } from './components/UnitController';
import { RTSCameraController } from './controllers/RTSCameraController';
import { UIController } from './controllers/UIController';

const { ccclass, property } = _decorator;

/**
 * RTS演示项目主控制器
 * 展示行为树在3D RTS游戏中的应用
 */
@ccclass('RTSDemo')
export class RTSDemo extends Component {
    
    @property(Prefab)
    unitPrefab: Prefab = null!;
    
    @property(Prefab)
    buildingPrefab: Prefab = null!;
    
    @property(Prefab)
    resourcePrefab: Prefab = null!;
    
    @property(Node)
    gameWorld: Node = null!;
    
    @property(Camera)
    mainCamera: Camera = null!;
    
    @property(Node)
    uiRoot: Node = null!;
    
    private cameraController: RTSCameraController = null!;
    private uiController: UIController = null!;
    
    // 游戏状态
    private units: Node[] = [];
    private buildings: Node[] = [];
    private resources: Node[] = [];
    private selectedUnits: Node[] = [];
    
    onLoad() {
        console.log('RTS Demo 初始化开始...');
        this.initializeControllers();
        this.setupScene();
        console.log('RTS Demo 初始化完成！');
    }
    
    /**
     * 初始化控制器
     */
    private initializeControllers() {
        // 相机控制器
        this.cameraController = this.mainCamera.getComponent(RTSCameraController) || 
                               this.mainCamera.addComponent(RTSCameraController);
        
        // UI控制器
        this.uiController = this.uiRoot.getComponent(UIController) || 
                           this.uiRoot.addComponent(UIController);
        
        // 设置UI回调
        this.uiController.onUnitSelected = this.onUnitSelected.bind(this);
        this.uiController.onCommandIssued = this.onCommandIssued.bind(this);
        
        console.log('控制器初始化完成');
    }
    
    /**
     * 设置场景
     */
    private setupScene() {
        this.createUnits();
        this.createBuildings();
        this.createResources();
        
        // 设置初始相机位置
        this.mainCamera.node.setPosition(0, 20, 15);
        this.mainCamera.node.lookAt(Vec3.ZERO);
        
        console.log('场景设置完成');
    }
    
    /**
     * 创建单位
     */
    private createUnits() {
        const unitTypes = [
            { name: 'Worker', behaviorTree: 'worker-ai', color: 'blue' },
            { name: 'Soldier', behaviorTree: 'soldier-ai', color: 'red' },
            { name: 'Scout', behaviorTree: 'scout-ai', color: 'green' }
        ];
        
        unitTypes.forEach((type, typeIndex) => {
            for (let i = 0; i < 3; i++) {
                const unit = instantiate(this.unitPrefab);
                unit.name = `${type.name}_${i + 1}`;
                
                // 设置位置
                const angle = (i / 3) * Math.PI * 2;
                const radius = 3 + typeIndex * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                unit.setPosition(x, 0, z);
                
                // 添加到场景
                this.gameWorld.addChild(unit);
                this.units.push(unit);
                
                // 配置单位组件
                const unitController = unit.getComponent(UnitController) || unit.addComponent(UnitController);
                unitController.setup({
                    unitType: type.name.toLowerCase(),
                    behaviorTreeName: type.behaviorTree,
                    maxHealth: 100,
                    moveSpeed: 3,
                    attackRange: 2,
                    attackDamage: 25,
                    color: type.color
                });
                
                console.log(`创建单位: ${unit.name} at (${x.toFixed(1)}, 0, ${z.toFixed(1)})`);
            }
        });
    }
    
    /**
     * 创建建筑
     */
    private createBuildings() {
        const buildingPositions = [
            { pos: new Vec3(-10, 0, -10), name: 'MainBase' },
            { pos: new Vec3(10, 0, 10), name: 'Barracks' },
            { pos: new Vec3(-8, 0, 8), name: 'ResourceCenter' }
        ];
        
        buildingPositions.forEach((building, index) => {
            const buildingNode = instantiate(this.buildingPrefab);
            buildingNode.name = building.name;
            buildingNode.setPosition(building.pos);
            
            this.gameWorld.addChild(buildingNode);
            this.buildings.push(buildingNode);
            
            console.log(`创建建筑: ${building.name} at ${building.pos}`);
        });
    }
    
    /**
     * 创建资源
     */
    private createResources() {
        const resourcePositions = [
            new Vec3(5, 0, -5),
            new Vec3(-5, 0, 5),
            new Vec3(8, 0, -8),
            new Vec3(-8, 0, -5),
            new Vec3(6, 0, 6)
        ];
        
        resourcePositions.forEach((pos, index) => {
            const resource = instantiate(this.resourcePrefab);
            resource.name = `Resource_${index + 1}`;
            resource.setPosition(pos);
            
            this.gameWorld.addChild(resource);
            this.resources.push(resource);
            
            console.log(`创建资源: ${resource.name} at ${pos}`);
        });
    }
    
    /**
     * 单位选择回调
     */
    private onUnitSelected(units: Node[]) {
        // 取消之前的选择
        this.selectedUnits.forEach(unit => {
            const unitController = unit.getComponent(UnitController);
            if (unitController) {
                unitController.setSelected(false);
            }
        });
        
        // 设置新选择
        this.selectedUnits = units;
        this.selectedUnits.forEach(unit => {
            const unitController = unit.getComponent(UnitController);
            if (unitController) {
                unitController.setSelected(true);
            }
        });
        
        console.log(`选择了 ${units.length} 个单位`);
        this.uiController.setSelectedUnitsCount(units.length);
    }
    
    /**
     * 命令发布回调
     */
    private onCommandIssued(command: string, target?: Vec3 | Node) {
        if (this.selectedUnits.length === 0) {
            console.log('没有选择单位');
            return;
        }
        
        this.selectedUnits.forEach(unit => {
            const unitController = unit.getComponent(UnitController);
            if (unitController) {
                unitController.issueCommand(command, target);
            }
        });
        
        console.log(`发布命令: ${command} 给 ${this.selectedUnits.length} 个单位`);
    }
    
    /**
     * 获取所有单位
     */
    getAllUnits(): Node[] {
        return [...this.units];
    }
    
    /**
     * 获取所有建筑
     */
    getAllBuildings(): Node[] {
        return [...this.buildings];
    }
    
    /**
     * 获取所有资源
     */
    getAllResources(): Node[] {
        return [...this.resources];
    }
} 
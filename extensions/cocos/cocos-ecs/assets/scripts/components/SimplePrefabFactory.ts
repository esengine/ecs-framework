import { _decorator, Component, Node, Vec3, MeshRenderer, BoxCollider, RigidBody, Mesh, Material, Color, primitives, utils } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 简单预制体工厂 - 创建基本的游戏对象
 * 用于在没有预制体资源时创建基本的单位、建筑和资源
 */
@ccclass('SimplePrefabFactory')
export class SimplePrefabFactory extends Component {
    
    /**
     * 创建单位节点
     */
    static createUnit(name: string, color: Color = Color.WHITE): Node {
        const unit = new Node(name);
        
        // 添加网格渲染器
        const meshRenderer = unit.addComponent(MeshRenderer);
        
        // 创建立方体网格
        const mesh = utils.createMesh(primitives.box({ width: 1, height: 1, length: 1 }));
        meshRenderer.mesh = mesh;
        
        // 创建材质
        const material = new Material();
        material.initialize({ effectName: 'builtin-unlit' });
        material.setProperty('mainColor', color);
        meshRenderer.material = material;
        
        // 添加碰撞器
        const collider = unit.addComponent(BoxCollider);
        collider.size = new Vec3(1, 1, 1);
        
        // 添加刚体
        const rigidBody = unit.addComponent(RigidBody);
        rigidBody.type = RigidBody.Type.KINEMATIC;
        
        console.log(`创建单位: ${name}`);
        return unit;
    }
    
    /**
     * 创建建筑节点
     */
    static createBuilding(name: string, size: Vec3 = new Vec3(2, 2, 2), color: Color = Color.GRAY): Node {
        const building = new Node(name);
        
        // 添加网格渲染器
        const meshRenderer = building.addComponent(MeshRenderer);
        
        // 创建立方体网格
        const mesh = utils.createMesh(primitives.box({ 
            width: size.x, 
            height: size.y, 
            length: size.z 
        }));
        meshRenderer.mesh = mesh;
        
        // 创建材质
        const material = new Material();
        material.initialize({ effectName: 'builtin-unlit' });
        material.setProperty('mainColor', color);
        meshRenderer.material = material;
        
        // 添加碰撞器
        const collider = building.addComponent(BoxCollider);
        collider.size = size;
        
        console.log(`创建建筑: ${name}`);
        return building;
    }
    
    /**
     * 创建资源节点
     */
    static createResource(name: string, color: Color = Color.YELLOW): Node {
        const resource = new Node(name);
        
        // 添加网格渲染器
        const meshRenderer = resource.addComponent(MeshRenderer);
        
        // 创建球体网格
        const mesh = utils.createMesh(primitives.sphere(0.5));
        meshRenderer.mesh = mesh;
        
        // 创建材质
        const material = new Material();
        material.initialize({ effectName: 'builtin-unlit' });
        material.setProperty('mainColor', color);
        meshRenderer.material = material;
        
        // 添加碰撞器
        const collider = resource.addComponent(BoxCollider);
        collider.size = new Vec3(1, 1, 1);
        
        console.log(`创建资源: ${name}`);
        return resource;
    }
    
    /**
     * 创建地面节点
     */
    static createGround(size: Vec3 = new Vec3(50, 0.1, 50), color: Color = new Color(100, 150, 100, 255)): Node {
        const ground = new Node('Ground');
        
        // 添加网格渲染器
        const meshRenderer = ground.addComponent(MeshRenderer);
        
        // 创建平面网格
        const mesh = utils.createMesh(primitives.box({ 
            width: size.x, 
            height: size.y, 
            length: size.z 
        }));
        meshRenderer.mesh = mesh;
        
        // 创建材质
        const material = new Material();
        material.initialize({ effectName: 'builtin-unlit' });
        material.setProperty('mainColor', color);
        meshRenderer.material = material;
        
        // 添加碰撞器
        const collider = ground.addComponent(BoxCollider);
        collider.size = size;
        
        console.log(`创建地面: ${size}`);
        return ground;
    }
} 
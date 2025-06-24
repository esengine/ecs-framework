import { _decorator, Component, Node, Camera, Vec3, input, Input, EventMouse, EventTouch, KeyCode, Quat } from 'cc';

const { ccclass, property } = _decorator;

/**
 * RTS相机控制器
 * 提供RTS游戏常用的相机控制功能
 */
@ccclass('RTSCameraController')
export class RTSCameraController extends Component {
    
    @property
    moveSpeed: number = 10;
    
    @property
    rotateSpeed: number = 60;
    
    @property
    zoomSpeed: number = 5;
    
    @property
    minZoom: number = 5;
    
    @property
    maxZoom: number = 30;
    
    @property
    boundarySize: number = 50;
    
    private camera: Camera = null!;
    private isMouseDown: boolean = false;
    private lastMousePosition: Vec3 = Vec3.ZERO.clone();
    private currentZoom: number = 15;
    
    // 键盘输入状态
    private keyStates: { [key: string]: boolean } = {};
    
    onLoad() {
        this.camera = this.getComponent(Camera)!;
        this.currentZoom = this.node.position.y;
        
        // 注册输入事件
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }
    
    onDestroy() {
        // 取消注册输入事件
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }
    
    /**
     * 鼠标按下事件
     */
    private onMouseDown(event: EventMouse) {
        if (event.getButton() === EventMouse.BUTTON_MIDDLE) {
            this.isMouseDown = true;
            this.lastMousePosition.set(event.getLocationX(), event.getLocationY(), 0);
        }
    }
    
    /**
     * 鼠标抬起事件
     */
    private onMouseUp(event: EventMouse) {
        if (event.getButton() === EventMouse.BUTTON_MIDDLE) {
            this.isMouseDown = false;
        }
    }
    
    /**
     * 鼠标移动事件
     */
    private onMouseMove(event: EventMouse) {
        if (this.isMouseDown) {
            const deltaX = event.getLocationX() - this.lastMousePosition.x;
            const deltaY = event.getLocationY() - this.lastMousePosition.y;
            
            // 相机平移
            const moveVector = new Vec3(-deltaX * 0.01, 0, deltaY * 0.01);
            this.node.translate(moveVector);
            
            this.lastMousePosition.set(event.getLocationX(), event.getLocationY(), 0);
            
            // 限制相机边界
            this.clampCameraBounds();
        }
    }
    
    /**
     * 鼠标滚轮事件
     */
    private onMouseWheel(event: EventMouse) {
        const scrollY = event.getScrollY();
        this.currentZoom -= scrollY * this.zoomSpeed * 0.1;
        this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.currentZoom));
        
        const pos = this.node.position;
        this.node.setPosition(pos.x, this.currentZoom, pos.z);
    }
    
    /**
     * 键盘按下事件
     */
    private onKeyDown(event: any) {
        this.keyStates[event.keyCode] = true;
    }
    
    /**
     * 键盘抬起事件
     */
    private onKeyUp(event: any) {
        this.keyStates[event.keyCode] = false;
    }
    
    /**
     * 更新相机移动
     */
    update(deltaTime: number) {
        this.handleKeyboardMovement(deltaTime);
    }
    
    /**
     * 处理键盘移动
     */
    private handleKeyboardMovement(deltaTime: number) {
        const moveDistance = this.moveSpeed * deltaTime;
        let moveVector = Vec3.ZERO.clone();
        
        // WASD 移动
        if (this.keyStates[KeyCode.KEY_W] || this.keyStates[KeyCode.ARROW_UP]) {
            moveVector.z -= moveDistance;
        }
        if (this.keyStates[KeyCode.KEY_S] || this.keyStates[KeyCode.ARROW_DOWN]) {
            moveVector.z += moveDistance;
        }
        if (this.keyStates[KeyCode.KEY_A] || this.keyStates[KeyCode.ARROW_LEFT]) {
            moveVector.x -= moveDistance;
        }
        if (this.keyStates[KeyCode.KEY_D] || this.keyStates[KeyCode.ARROW_RIGHT]) {
            moveVector.x += moveDistance;
        }
        
        // 应用移动
        if (!moveVector.equals(Vec3.ZERO)) {
            this.node.translate(moveVector);
            this.clampCameraBounds();
        }
        
        // QE 旋转
        if (this.keyStates[KeyCode.KEY_Q]) {
            const rotateAngle = this.rotateSpeed * deltaTime * Math.PI / 180;
            const currentRotation = this.node.rotation.clone();
            const yRotation = Quat.fromAxisAngle(new Quat(), Vec3.UP, rotateAngle);
            Quat.multiply(currentRotation, currentRotation, yRotation);
            this.node.rotation = currentRotation;
        }
        if (this.keyStates[KeyCode.KEY_E]) {
            const rotateAngle = -this.rotateSpeed * deltaTime * Math.PI / 180;
            const currentRotation = this.node.rotation.clone();
            const yRotation = Quat.fromAxisAngle(new Quat(), Vec3.UP, rotateAngle);
            Quat.multiply(currentRotation, currentRotation, yRotation);
            this.node.rotation = currentRotation;
        }
    }
    
    /**
     * 限制相机边界
     */
    private clampCameraBounds() {
        const pos = this.node.position;
        const clampedX = Math.max(-this.boundarySize, Math.min(this.boundarySize, pos.x));
        const clampedZ = Math.max(-this.boundarySize, Math.min(this.boundarySize, pos.z));
        
        this.node.setPosition(clampedX, pos.y, clampedZ);
    }
    
    /**
     * 设置相机位置
     */
    setCameraPosition(position: Vec3) {
        this.node.setPosition(position);
        this.clampCameraBounds();
    }
    
    /**
     * 聚焦到目标位置
     */
    focusOnTarget(target: Vec3, duration: number = 1.0) {
        const targetPos = new Vec3(target.x, this.currentZoom, target.z);
        // 这里可以添加缓动动画
        this.setCameraPosition(targetPos);
    }
} 
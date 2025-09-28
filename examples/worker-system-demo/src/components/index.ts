import { Component, ECSComponent } from '@esengine/ecs-framework';

// 位置组件
@ECSComponent('Position')
export class Position extends Component {
    x: number = 0;
    y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }

    set(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
}

// 速度组件
@ECSComponent('Velocity')
export class Velocity extends Component {
    dx: number = 0;
    dy: number = 0;

    constructor(dx: number = 0, dy: number = 0) {
        super();
        this.dx = dx;
        this.dy = dy;
    }

    set(dx: number, dy: number): void {
        this.dx = dx;
        this.dy = dy;
    }

    scale(factor: number): void {
        this.dx *= factor;
        this.dy *= factor;
    }
}

// 物理组件
@ECSComponent('Physics')
export class Physics extends Component {
    mass: number = 1;
    bounce: number = 0.8;
    friction: number = 0.95;

    constructor(mass: number = 1, bounce: number = 0.8, friction: number = 0.95) {
        super();
        this.mass = mass;
        this.bounce = bounce;
        this.friction = friction;
    }
}

// 渲染组件
@ECSComponent('Renderable')
export class Renderable extends Component {
    color: string = '#ffffff';
    size: number = 5;
    shape: 'circle' | 'square' = 'circle';

    constructor(color: string = '#ffffff', size: number = 5, shape: 'circle' | 'square' = 'circle') {
        super();
        this.color = color;
        this.size = size;
        this.shape = shape;
    }
}

// 生命周期组件
@ECSComponent('Lifetime')
export class Lifetime extends Component {
    maxAge: number = 5;
    currentAge: number = 0;

    constructor(maxAge: number = 5) {
        super();
        this.maxAge = maxAge;
        this.currentAge = 0;
    }

    isDead(): boolean {
        return this.currentAge >= this.maxAge;
    }
}
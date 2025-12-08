/**
 * 组件定义
 * Component definitions
 */
import { Component, ECSComponent } from '@esengine/ecs-framework';

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
}

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

@ECSComponent('Renderable')
export class Renderable extends Component {
    color: string = '#ffffff';
    size: number = 5;

    constructor(color: string = '#ffffff', size: number = 5) {
        super();
        this.color = color;
        this.size = size;
    }
}

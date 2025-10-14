import { Component } from '@esengine/ecs-framework';

export class RigidBodyComponent extends Component {
  public mass: number = 1;
  public velocityX: number = 0;
  public velocityY: number = 0;
  public gravity: boolean = true;
}

import { Component } from '@esengine/ecs-framework';

export class TransformComponent extends Component {
  public x: number = 0;
  public y: number = 0;
  public rotation: number = 0;
  public scaleX: number = 1;
  public scaleY: number = 1;
}

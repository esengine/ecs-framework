import { Component } from '@esengine/ecs-framework';

export class SpriteComponent extends Component {
  public texture: string = '';
  public width: number = 100;
  public height: number = 100;
  public alpha: number = 1;
}

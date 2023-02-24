module es {
    /**
     * 扇形碰撞器
     */
    export class SectorCollider extends Collider {
        constructor(
          center: Vector2,
          radius: number,
          startAngle: number,
          endAngle: number
        ) {
          super();
          this.shape = new Sector(center, radius, startAngle, endAngle);
        }
    }
}
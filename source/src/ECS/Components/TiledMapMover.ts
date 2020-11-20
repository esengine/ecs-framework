// module es {
//     /**
//      * 用来存放来自移动调用的所有冲突信息
//      */
//     export class CollisionState {
//         public right: boolean;
//         public left: boolean;
//         public above: boolean;
//         public below: boolean;
//         public becameGroundedThisFrame: boolean;
//         public wasGroundedLastFrame: boolean;
//         public isGroundedOnOnewayPlatform: boolean;
//         public slopAngle: number;

//         public get hasCollision(): boolean {
//             return this.below || this.right || this.left || this.above;
//         }

//         public _movementRemainderX: SubpixelNumber;
//         public _movementRemainderY: SubpixelNumber;

//         public reset() {
//             this.becameGroundedThisFrame = this.isGroundedOnOnewayPlatform = this.right = this.left = this.above = this.below = false;
//             this.slopAngle = 0;
//         }

//         public toString() {
//             return `[CollisionState] r: ${this.right}, l: ${this.left}, a: ${this.above}, b: ${this.below}, angle: ${this.slopAngle}, wasGroundedLastFrame: ${this.wasGroundedLastFrame}, becameGroundedThisFrame: ${this.becameGroundedThisFrame}`;
//         }
//     }

//     /**
//      * TiledMapMover是在基于重力的平铺地图中移动对象的助手。
//      * 它要求它所在的实体有一个BoxCollider。BoxCollider将与colliderHorizontal/VerticalInset用于所有碰撞检测。
//      *
//      * 一种方法是通过将你的Transform向下移动1个像素并调用CollisionState.clearLastGroundTile来跳过平台。
//      */
//     export class TiledMapMover extends Component {
//         /**
//          * 在垂直移动时，BoxCollider将根据水平面上的嵌入缩小
//          */
//         public colliderHorizontalInset = 2;

//         /**
//          * 垂直平面上的嵌入，在水平移动时，BoxCollider将根据该嵌入缩小
//          */
//         public colliderVerticalInset = 6;

//         /**
//          * 临时存储
//          */
//         public _boxColliderBounds: Rectangle;

//         constructor() {
//             super();
//         }

//         /**
//          * 测试碰撞，然后移动实体
//          * @param motion
//          * @param boxColliderBounds
//          * @param collisionState
//          */
//         public testCollisions(motion: Vector2, boxColliderBounds: Rectangle, collisionState: CollisionState) {
//             this._boxColliderBounds = boxColliderBounds;

//             // 保存我们当前的接地状态，我们将用于wasGroundedLastFrame和becameGroundedThisFrame
//             collisionState.wasGroundedLastFrame = collisionState.below;

//             // 重置碰撞状态
//             collisionState.reset();

//             // 获取圆角值用于我们的实际检测
//             let motionX = motion.x;
//             let motionY = motion.y;

//             // 首先，检查水平方向中的移动
//             if (motionX != 0){
//                 let direction = motionX > 0 ? Edge.right : Edge.left;
//                 let sweptBounds = this.collisionRectForSide(direction, motionX);

//                 let collisionResponse: number = 0;
//                 if (this.testMapCollision(sweptBounds, direction, collisionState, collisionResponse)){
//                     motion.x = collisionResponse - RectangleExt.getSide(boxColliderBounds, direction);
//                     collisionState.left = direction == Edge.left;
//                     collisionState.right = direction == Edge.right;
//                     collisionState._movementRemainderX.reset();
//                 }else{
//                     collisionState.left = false;
//                     collisionState.right = false;
//                 }
//             }
//         }

//         public testMapCollision(collisionRect: Rectangle, direction: Edge, collisionState: CollisionState, collisionResponse: number){
//             let side = EdgeExt.oppositeEdge(direction);
//             let perpindicularPosition = EdgeExt.isVertical(side) ? collisionRect.center.x : collisionRect.center.y;
//             let leadingPosition = RectangleExt.getSide(collisionRect, direction);
//             let shouldTestSlopes = EdgeExt.isVertical(side);
//         }

//         /**
//          * 获取展开以考虑运动的给定边的碰撞矩形
//          * @param side
//          * @param motion
//          */
//         public collisionRectForSide(side: Edge, motion: number){
//             let bounds: Rectangle;

//             // 对于水平碰撞检查，我们只使用一个条块作为边界。Vertical得到矩形的一半，就可以正确地向上推，
//             // 当相交的斜率，忽略以进行水平移动。
//             if (EdgeExt.isHorizontal(side)){
//                 bounds = RectangleExt.getRectEdgePortion(this._boxColliderBounds, side);
//             }else {
//                 bounds = RectangleExt.getHalfRect(this._boxColliderBounds, side);
//             }

//             // 我们水平收缩用于垂直移动，垂直收缩用于水平移动
//             if (EdgeExt.isVertical(side)){
//                 RectangleExt.contract(bounds, this.colliderHorizontalInset, 0);
//             }else {
//                 RectangleExt.contract(bounds, 0, this.colliderVerticalInset);
//             }

//             // 最后在移动方向上扩展边
//             RectangleExt.expandSide(bounds, side, motion);

//             return bounds;
//         }
//     }
// }
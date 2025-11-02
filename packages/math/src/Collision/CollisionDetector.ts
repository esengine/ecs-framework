import { Vector2 } from '../Vector2';
import { Rectangle } from '../Rectangle';
import { Circle } from '../Circle';

/**
 * 碰撞信息接口
 */
export interface CollisionInfo {
  /** 是否发生碰撞 */
  collided: boolean;
  /** 碰撞法线（指向第二个对象） */
  normal?: Vector2;
  /** 穿透深度 */
  penetration?: number;
  /** 碰撞点 */
  contactPoint?: Vector2;
}

/**
 * 碰撞检测器
 *
 * 提供各种几何体之间的碰撞检测功能
 */
export class CollisionDetector {

    // 点与几何体碰撞检测

    /**
   * 点与圆形碰撞检测
   * @param point 点
   * @param circle 圆形
   * @returns 碰撞信息
   */
    static pointCircle(point: Vector2, circle: Circle): CollisionInfo {
        const distance = Vector2.distance(point, circle.center);
        const collided = distance <= circle.radius;

        if (!collided) {
            return { collided: false };
        }

        const normal = distance > 0
            ? Vector2.subtract(point, circle.center).normalize()
            : new Vector2(1, 0); // 默认法线

        return {
            collided: true,
            normal,
            penetration: circle.radius - distance,
            contactPoint: point.clone()
        };
    }

    /**
   * 点与矩形碰撞检测
   * @param point 点
   * @param rect 矩形
   * @returns 碰撞信息
   */
    static pointRect(point: Vector2, rect: Rectangle): CollisionInfo {
        const collided = rect.containsPoint(point);

        if (!collided) {
            return { collided: false };
        }

        // 计算到各边的距离
        const distLeft = point.x - rect.left;
        const distRight = rect.right - point.x;
        const distTop = point.y - rect.top;
        const distBottom = rect.bottom - point.y;

        // 找到最小距离确定法线方向
        const minDist = Math.min(distLeft, distRight, distTop, distBottom);
        let normal: Vector2;
        const penetration = minDist;

        if (minDist === distLeft) {
            normal = new Vector2(-1, 0);
        } else if (minDist === distRight) {
            normal = new Vector2(1, 0);
        } else if (minDist === distTop) {
            normal = new Vector2(0, -1);
        } else {
            normal = new Vector2(0, 1);
        }

        return {
            collided: true,
            normal,
            penetration,
            contactPoint: point.clone()
        };
    }

    // 圆形碰撞检测

    /**
   * 圆形与圆形碰撞检测
   * @param circle1 第一个圆形
   * @param circle2 第二个圆形
   * @returns 碰撞信息
   */
    static circleCircle(circle1: Circle, circle2: Circle): CollisionInfo {
        const distance = Vector2.distance(circle1.center, circle2.center);
        const radiusSum = circle1.radius + circle2.radius;
        const collided = distance <= radiusSum;

        if (!collided) {
            return { collided: false };
        }

        const normal = distance > 0
            ? Vector2.subtract(circle2.center, circle1.center).normalize()
            : new Vector2(1, 0); // 默认法线

        const penetration = radiusSum - distance;
        const contactPoint = circle1.center.clone().add(
            normal.clone().multiply(circle1.radius - penetration * 0.5)
        );

        return {
            collided: true,
            normal,
            penetration,
            contactPoint
        };
    }

    /**
   * 圆形与矩形碰撞检测
   * @param circle 圆形
   * @param rect 矩形
   * @returns 碰撞信息
   */
    static circleRect(circle: Circle, rect: Rectangle): CollisionInfo {
    // 找到矩形上离圆心最近的点
        const closestPoint = rect.closestPointTo(circle.center);

        // 检查是否碰撞
        const distance = Vector2.distance(circle.center, closestPoint);
        const collided = distance <= circle.radius;

        if (!collided) {
            return { collided: false };
        }

        // 计算法线和穿透深度
        const normal = distance > 0
            ? Vector2.subtract(closestPoint, circle.center).normalize()
            : new Vector2(0, -1); // 默认法线（圆心在矩形内部时）

        const penetration = circle.radius - distance;

        return {
            collided: true,
            normal,
            penetration,
            contactPoint: closestPoint
        };
    }

    // 矩形碰撞检测

    /**
   * 矩形与矩形碰撞检测（AABB）
   * @param rect1 第一个矩形
   * @param rect2 第二个矩形
   * @returns 碰撞信息
   */
    static rectRect(rect1: Rectangle, rect2: Rectangle): CollisionInfo {
        const collided = rect1.intersects(rect2);

        if (!collided) {
            return { collided: false };
        }

        // 计算重叠区域
        const overlapLeft = Math.max(rect1.left, rect2.left);
        const overlapRight = Math.min(rect1.right, rect2.right);
        const overlapTop = Math.max(rect1.top, rect2.top);
        const overlapBottom = Math.min(rect1.bottom, rect2.bottom);

        const overlapWidth = overlapRight - overlapLeft;
        const overlapHeight = overlapBottom - overlapTop;

        // 确定分离方向（最小重叠轴）
        let normal: Vector2;
        let penetration: number;

        if (overlapWidth < overlapHeight) {
            // 水平分离
            penetration = overlapWidth;
            if (rect1.centerX < rect2.centerX) {
                normal = new Vector2(-1, 0);
            } else {
                normal = new Vector2(1, 0);
            }
        } else {
            // 垂直分离
            penetration = overlapHeight;
            if (rect1.centerY < rect2.centerY) {
                normal = new Vector2(0, -1);
            } else {
                normal = new Vector2(0, 1);
            }
        }

        const contactPoint = new Vector2(
            (overlapLeft + overlapRight) * 0.5,
            (overlapTop + overlapBottom) * 0.5
        );

        return {
            collided: true,
            normal,
            penetration,
            contactPoint
        };
    }

    // 射线投射

    /**
   * 射线与圆形相交检测
   * @param rayOrigin 射线起点
   * @param rayDirection 射线方向（单位向量）
   * @param circle 圆形
   * @param maxDistance 最大检测距离，默认无限
   * @returns 碰撞信息，包含距离信息
   */
    static rayCircle(
        rayOrigin: Vector2,
        rayDirection: Vector2,
        circle: Circle,
        maxDistance: number = Infinity
    ): CollisionInfo & { distance?: number } {

        const oc = Vector2.subtract(rayOrigin, circle.center);
        const a = rayDirection.lengthSquared;
        const b = 2 * Vector2.dot(oc, rayDirection);
        const c = oc.lengthSquared - circle.radius * circle.radius;

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return { collided: false };
        }

        const sqrt = Math.sqrt(discriminant);
        const t1 = (-b - sqrt) / (2 * a);
        const t2 = (-b + sqrt) / (2 * a);

        // 选择最近的正距离
        const t = t1 >= 0 ? t1 : t2;

        if (t < 0 || t > maxDistance) {
            return { collided: false };
        }

        const contactPoint = rayOrigin.clone().add(rayDirection.clone().multiply(t));
        const normal = Vector2.subtract(contactPoint, circle.center).normalize();

        return {
            collided: true,
            normal,
            contactPoint,
            distance: t,
            penetration: 0 // 射线检测不计算穿透
        };
    }

    /**
   * 射线与矩形相交检测
   * @param rayOrigin 射线起点
   * @param rayDirection 射线方向（单位向量）
   * @param rect 矩形
   * @param maxDistance 最大检测距离，默认无限
   * @returns 碰撞信息，包含距离信息
   */
    static rayRect(
        rayOrigin: Vector2,
        rayDirection: Vector2,
        rect: Rectangle,
        maxDistance: number = Infinity
    ): CollisionInfo & { distance?: number } {

        // 避免除零
        const invDirX = rayDirection.x !== 0 ? 1 / rayDirection.x : 1e10;
        const invDirY = rayDirection.y !== 0 ? 1 / rayDirection.y : 1e10;

        // 计算与各边的交点参数
        const t1 = (rect.left - rayOrigin.x) * invDirX;
        const t2 = (rect.right - rayOrigin.x) * invDirX;
        const t3 = (rect.top - rayOrigin.y) * invDirY;
        const t4 = (rect.bottom - rayOrigin.y) * invDirY;

        const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
        const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

        // 没有交点或交点在射线反方向
        if (tmax < 0 || tmin > tmax || tmin > maxDistance) {
            return { collided: false };
        }

        const t = tmin >= 0 ? tmin : tmax;
        const contactPoint = rayOrigin.clone().add(rayDirection.clone().multiply(t));

        // 确定法线方向
        let normal: Vector2;
        const epsilon = 1e-6;

        if (Math.abs(contactPoint.x - rect.left) < epsilon) {
            normal = new Vector2(-1, 0);
        } else if (Math.abs(contactPoint.x - rect.right) < epsilon) {
            normal = new Vector2(1, 0);
        } else if (Math.abs(contactPoint.y - rect.top) < epsilon) {
            normal = new Vector2(0, -1);
        } else {
            normal = new Vector2(0, 1);
        }

        return {
            collided: true,
            normal,
            contactPoint,
            distance: t,
            penetration: 0 // 射线检测不计算穿透
        };
    }

    // 线段相交检测

    /**
   * 线段与线段相交检测
   * @param p1 第一条线段起点
   * @param p2 第一条线段终点
   * @param p3 第二条线段起点
   * @param p4 第二条线段终点
   * @returns 碰撞信息
   */
    static lineSegmentLineSegment(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2): CollisionInfo {
        const d1 = Vector2.subtract(p2, p1);
        const d2 = Vector2.subtract(p4, p3);
        const d3 = Vector2.subtract(p3, p1);

        const cross = Vector2.cross(d1, d2);

        if (Math.abs(cross) < Number.EPSILON) {
            // 平行或共线
            return { collided: false };
        }

        const t1 = Vector2.cross(d3, d2) / cross;
        const t2 = Vector2.cross(d3, d1) / cross;

        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
            const contactPoint = p1.clone().add(d1.clone().multiply(t1));

            // 计算法线（垂直于第一条线段）
            const normal = d1.perpendicular().normalize();

            return {
                collided: true,
                normal,
                contactPoint,
                penetration: 0 // 线段相交不计算穿透
            };
        }

        return { collided: false };
    }

    /**
   * 线段与圆形相交检测
   * @param lineStart 线段起点
   * @param lineEnd 线段终点
   * @param circle 圆形
   * @returns 碰撞信息
   */
    static lineSegmentCircle(lineStart: Vector2, lineEnd: Vector2, circle: Circle): CollisionInfo {
        const d = Vector2.subtract(lineEnd, lineStart);
        const f = Vector2.subtract(lineStart, circle.center);

        const a = Vector2.dot(d, d);
        const b = 2 * Vector2.dot(f, d);
        const c = Vector2.dot(f, f) - circle.radius * circle.radius;

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return { collided: false };
        }

        const sqrt = Math.sqrt(discriminant);
        const t1 = (-b - sqrt) / (2 * a);
        const t2 = (-b + sqrt) / (2 * a);

        // 检查交点是否在线段上
        const validT = [];
        if (t1 >= 0 && t1 <= 1) validT.push(t1);
        if (t2 >= 0 && t2 <= 1) validT.push(t2);

        if (validT.length === 0) {
            return { collided: false };
        }

        // 使用最近的交点
        const t = validT[0];
        const contactPoint = lineStart.clone().add(d.clone().multiply(t));
        const normal = Vector2.subtract(contactPoint, circle.center).normalize();

        return {
            collided: true,
            normal,
            contactPoint,
            penetration: 0 // 线段相交不计算穿透
        };
    }

    // 快速排斥测试

    /**
   * AABB包围盒快速排斥测试
   * @param bounds1 第一个包围盒
   * @param bounds2 第二个包围盒
   * @returns 是否可能相交
   */
    static aabbTest(bounds1: Rectangle, bounds2: Rectangle): boolean {
        return bounds1.intersects(bounds2);
    }

    /**
   * 圆形包围盒快速排斥测试
   * @param center1 第一个圆心
   * @param radius1 第一个半径
   * @param center2 第二个圆心
   * @param radius2 第二个半径
   * @returns 是否可能相交
   */
    static circleTest(center1: Vector2, radius1: number, center2: Vector2, radius2: number): boolean {
        const distance = Vector2.distance(center1, center2);
        return distance <= radius1 + radius2;
    }
}

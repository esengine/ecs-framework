import { CollisionDetector } from '../src/Collision/CollisionDetector';
import { Vector2 } from '../src/Vector2';
import { Rectangle } from '../src/Rectangle';
import { Circle } from '../src/Circle';

declare global {
  var expectFloatsEqual: (actual: number, expected: number, epsilon?: number) => void;
}

describe('CollisionDetector', () => {
  describe('点与几何体碰撞', () => {
    test('点与圆形碰撞检测', () => {
      const circle = new Circle(0, 0, 5);
      const pointInside = new Vector2(3, 0);
      const pointOutside = new Vector2(10, 0);
      const pointOnBoundary = new Vector2(5, 0);

      const collision1 = CollisionDetector.pointCircle(pointInside, circle);
      expect(collision1.collided).toBe(true);
      expect(collision1.penetration).toBe(2);

      const collision2 = CollisionDetector.pointCircle(pointOutside, circle);
      expect(collision2.collided).toBe(false);

      const collision3 = CollisionDetector.pointCircle(pointOnBoundary, circle);
      expect(collision3.collided).toBe(true);
      expectFloatsEqual(collision3.penetration!, 0, 1e-10);
    });

    test('点与矩形碰撞检测', () => {
      const rect = new Rectangle(10, 10, 20, 20);
      const pointInside = new Vector2(15, 15);
      const pointOutside = new Vector2(5, 5);

      const collision1 = CollisionDetector.pointRect(pointInside, rect);
      expect(collision1.collided).toBe(true);
      expect(collision1.normal).toBeDefined();

      const collision2 = CollisionDetector.pointRect(pointOutside, rect);
      expect(collision2.collided).toBe(false);
    });
  });

  describe('圆形碰撞检测', () => {
    test('圆形与圆形碰撞检测', () => {
      const circle1 = new Circle(0, 0, 5);
      const circle2 = new Circle(8, 0, 5); // 相交
      const circle3 = new Circle(15, 0, 5); // 不相交
      const circle4 = new Circle(10, 0, 5); // 边界接触

      const collision1 = CollisionDetector.circleCircle(circle1, circle2);
      expect(collision1.collided).toBe(true);
      expect(collision1.penetration).toBe(2);

      const collision2 = CollisionDetector.circleCircle(circle1, circle3);
      expect(collision2.collided).toBe(false);

      const collision3 = CollisionDetector.circleCircle(circle1, circle4);
      expect(collision3.collided).toBe(true);
      expectFloatsEqual(collision3.penetration!, 0, 1e-10);
    });

    test('圆形与矩形碰撞检测', () => {
      const circle = new Circle(15, 15, 5);
      const rect1 = new Rectangle(10, 10, 20, 20); // 相交
      const rect2 = new Rectangle(30, 30, 10, 10); // 不相交

      const collision1 = CollisionDetector.circleRect(circle, rect1);
      expect(collision1.collided).toBe(true);

      const collision2 = CollisionDetector.circleRect(circle, rect2);
      expect(collision2.collided).toBe(false);
    });
  });

  describe('矩形碰撞检测', () => {
    test('矩形与矩形碰撞检测', () => {
      const rect1 = new Rectangle(10, 10, 20, 20);
      const rect2 = new Rectangle(15, 15, 20, 20); // 相交
      const rect3 = new Rectangle(40, 40, 10, 10); // 不相交

      const collision1 = CollisionDetector.rectRect(rect1, rect2);
      expect(collision1.collided).toBe(true);
      expect(collision1.penetration).toBeGreaterThan(0);
      expect(collision1.normal).toBeDefined();

      const collision2 = CollisionDetector.rectRect(rect1, rect3);
      expect(collision2.collided).toBe(false);
    });
  });

  describe('射线投射', () => {
    test('射线与圆形相交', () => {
      const rayOrigin = new Vector2(-10, 0);
      const rayDirection = new Vector2(1, 0);
      const circle = new Circle(0, 0, 5);

      const collision = CollisionDetector.rayCircle(rayOrigin, rayDirection, circle);
      expect(collision.collided).toBe(true);
      expect(collision.distance).toBe(5);
      expect(collision.contactPoint!.x).toBe(-5);
      expect(collision.contactPoint!.y).toBe(0);
    });

    test('射线与圆形不相交', () => {
      const rayOrigin = new Vector2(-10, 10);
      const rayDirection = new Vector2(1, 0);
      const circle = new Circle(0, 0, 5);

      const collision = CollisionDetector.rayCircle(rayOrigin, rayDirection, circle);
      expect(collision.collided).toBe(false);
    });

    test('射线与矩形相交', () => {
      const rayOrigin = new Vector2(-5, 15);
      const rayDirection = new Vector2(1, 0);
      const rect = new Rectangle(10, 10, 20, 20);

      const collision = CollisionDetector.rayRect(rayOrigin, rayDirection, rect);
      expect(collision.collided).toBe(true);
      expect(collision.distance).toBe(15);
    });

    test('射线距离限制', () => {
      const rayOrigin = new Vector2(-10, 0);
      const rayDirection = new Vector2(1, 0);
      const circle = new Circle(0, 0, 5);

      const collision = CollisionDetector.rayCircle(rayOrigin, rayDirection, circle, 3);
      expect(collision.collided).toBe(false);
    });
  });

  describe('线段相交', () => {
    test('线段与线段相交', () => {
      const p1 = new Vector2(0, 0);
      const p2 = new Vector2(10, 10);
      const p3 = new Vector2(0, 10);
      const p4 = new Vector2(10, 0);

      const collision = CollisionDetector.lineSegmentLineSegment(p1, p2, p3, p4);
      expect(collision.collided).toBe(true);
      expect(collision.contactPoint!.x).toBe(5);
      expect(collision.contactPoint!.y).toBe(5);
    });

    test('线段与线段不相交', () => {
      const p1 = new Vector2(0, 0);
      const p2 = new Vector2(5, 5);
      const p3 = new Vector2(10, 0);
      const p4 = new Vector2(15, 5);

      const collision = CollisionDetector.lineSegmentLineSegment(p1, p2, p3, p4);
      expect(collision.collided).toBe(false);
    });

    test('线段与圆形相交', () => {
      const lineStart = new Vector2(-10, 0);
      const lineEnd = new Vector2(10, 0);
      const circle = new Circle(0, 0, 5);

      const collision = CollisionDetector.lineSegmentCircle(lineStart, lineEnd, circle);
      expect(collision.collided).toBe(true);
    });
  });

  describe('快速排斥测试', () => {
    test('AABB包围盒测试', () => {
      const bounds1 = new Rectangle(10, 10, 20, 20);
      const bounds2 = new Rectangle(15, 15, 20, 20);
      const bounds3 = new Rectangle(40, 40, 10, 10);

      expect(CollisionDetector.aabbTest(bounds1, bounds2)).toBe(true);
      expect(CollisionDetector.aabbTest(bounds1, bounds3)).toBe(false);
    });

    test('圆形包围盒测试', () => {
      const center1 = new Vector2(0, 0);
      const center2 = new Vector2(8, 0);
      const center3 = new Vector2(15, 0);

      expect(CollisionDetector.circleTest(center1, 5, center2, 5)).toBe(true);
      expect(CollisionDetector.circleTest(center1, 5, center3, 5)).toBe(false);
    });
  });

  describe('边界情况', () => {
    test('零半径圆形', () => {
      const point = new Vector2(0, 0);
      const circle = new Circle(0, 0, 0);

      const collision = CollisionDetector.pointCircle(point, circle);
      expect(collision.collided).toBe(true);
    });

    test('零面积矩形', () => {
      const point = new Vector2(10, 10);
      const rect = new Rectangle(10, 10, 0, 0);

      const collision = CollisionDetector.pointRect(point, rect);
      expect(collision.collided).toBe(true);
    });

    test('同心圆形', () => {
      const circle1 = new Circle(0, 0, 5);
      const circle2 = new Circle(0, 0, 3);

      const collision = CollisionDetector.circleCircle(circle1, circle2);
      expect(collision.collided).toBe(true);
    });
  });
});
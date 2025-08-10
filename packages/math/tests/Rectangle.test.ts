import { Rectangle } from '../src/Rectangle';
import { Vector2 } from '../src/Vector2';

declare global {
  var expectFloatsEqual: (actual: number, expected: number, epsilon?: number) => void;
}

describe('Rectangle', () => {
  describe('构造函数和基础属性', () => {
    test('默认构造函数应创建空矩形', () => {
      const rect = new Rectangle();
      expect(rect.x).toBe(0);
      expect(rect.y).toBe(0);
      expect(rect.width).toBe(0);
      expect(rect.height).toBe(0);
    });

    test('应正确设置矩形参数', () => {
      const rect = new Rectangle(10, 20, 100, 50);
      expect(rect.x).toBe(10);
      expect(rect.y).toBe(20);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(50);
    });

    test('边界属性应正确计算', () => {
      const rect = new Rectangle(10, 20, 100, 50);
      expect(rect.left).toBe(10);
      expect(rect.right).toBe(110);
      expect(rect.top).toBe(20);
      expect(rect.bottom).toBe(70);
    });

    test('中心属性应正确计算', () => {
      const rect = new Rectangle(10, 20, 100, 50);
      expect(rect.centerX).toBe(60);
      expect(rect.centerY).toBe(45);
      
      const center = rect.center;
      expect(center.x).toBe(60);
      expect(center.y).toBe(45);
    });

    test('角点属性应正确计算', () => {
      const rect = new Rectangle(10, 20, 100, 50);
      
      expect(rect.topLeft.x).toBe(10);
      expect(rect.topLeft.y).toBe(20);
      expect(rect.topRight.x).toBe(110);
      expect(rect.topRight.y).toBe(20);
      expect(rect.bottomLeft.x).toBe(10);
      expect(rect.bottomLeft.y).toBe(70);
      expect(rect.bottomRight.x).toBe(110);
      expect(rect.bottomRight.y).toBe(70);
    });

    test('面积和周长应正确计算', () => {
      const rect = new Rectangle(0, 0, 10, 5);
      expect(rect.area).toBe(50);
      expect(rect.perimeter).toBe(30);
    });
  });

  describe('基础操作', () => {
    test('set方法应正确设置值', () => {
      const rect = new Rectangle();
      rect.set(1, 2, 3, 4);
      expect(rect.x).toBe(1);
      expect(rect.y).toBe(2);
      expect(rect.width).toBe(3);
      expect(rect.height).toBe(4);
    });

    test('copy方法应正确复制', () => {
      const rect1 = new Rectangle(1, 2, 3, 4);
      const rect2 = new Rectangle();
      rect2.copy(rect1);
      expect(rect2.x).toBe(1);
      expect(rect2.y).toBe(2);
      expect(rect2.width).toBe(3);
      expect(rect2.height).toBe(4);
    });

    test('clone方法应创建相同的新实例', () => {
      const rect1 = new Rectangle(1, 2, 3, 4);
      const rect2 = rect1.clone();
      expect(rect2.x).toBe(1);
      expect(rect2.y).toBe(2);
      expect(rect2.width).toBe(3);
      expect(rect2.height).toBe(4);
      expect(rect2).not.toBe(rect1);
    });

    test('setCenter方法应正确设置中心点', () => {
      const rect = new Rectangle(0, 0, 10, 10);
      rect.setCenter(50, 60);
      expect(rect.x).toBe(45);
      expect(rect.y).toBe(55);
      expect(rect.centerX).toBe(50);
      expect(rect.centerY).toBe(60);
    });
  });

  describe('变换操作', () => {
    test('translate方法应正确平移', () => {
      const rect = new Rectangle(10, 20, 30, 40);
      rect.translate(5, 10);
      expect(rect.x).toBe(15);
      expect(rect.y).toBe(30);
      expect(rect.width).toBe(30);
      expect(rect.height).toBe(40);
    });

    test('scale方法应正确缩放', () => {
      const rect = new Rectangle(10, 10, 20, 30);
      const originalCenterX = rect.centerX;
      const originalCenterY = rect.centerY;
      
      rect.scale(2, 3);
      
      expect(rect.width).toBe(40);
      expect(rect.height).toBe(90);
      expect(rect.centerX).toBe(originalCenterX);
      expect(rect.centerY).toBe(originalCenterY);
    });

    test('inflate方法应正确扩展', () => {
      const rect = new Rectangle(10, 10, 20, 30);
      rect.inflate(5);
      expect(rect.x).toBe(5);
      expect(rect.y).toBe(5);
      expect(rect.width).toBe(30);
      expect(rect.height).toBe(40);
    });
  });

  describe('包含检测', () => {
    const rect = new Rectangle(10, 10, 20, 30);

    test('containsPoint应正确检测点包含', () => {
      const point1 = new Vector2(15, 15);
      const point2 = new Vector2(5, 5);
      const point3 = new Vector2(10, 10); // 边界点
      
      expect(rect.containsPoint(point1)).toBe(true);
      expect(rect.containsPoint(point2)).toBe(false);
      expect(rect.containsPoint(point3)).toBe(true);
    });

    test('contains方法应正确检测坐标包含', () => {
      expect(rect.contains(15, 15)).toBe(true);
      expect(rect.contains(5, 5)).toBe(false);
    });

    test('containsRect应正确检测矩形包含', () => {
      const inside = new Rectangle(12, 12, 5, 5);
      const outside = new Rectangle(5, 5, 5, 5);
      const overlapping = new Rectangle(8, 8, 5, 5);
      
      expect(rect.containsRect(inside)).toBe(true);
      expect(rect.containsRect(outside)).toBe(false);
      expect(rect.containsRect(overlapping)).toBe(false);
    });
  });

  describe('相交检测', () => {
    const rect1 = new Rectangle(10, 10, 20, 20);

    test('intersects应正确检测相交', () => {
      const rect2 = new Rectangle(15, 15, 20, 20); // 相交
      const rect3 = new Rectangle(40, 40, 10, 10); // 不相交
      const rect4 = new Rectangle(30, 10, 10, 20); // 边界接触
      
      expect(rect1.intersects(rect2)).toBe(true);
      expect(rect1.intersects(rect3)).toBe(false);
      expect(rect1.intersects(rect4)).toBe(false);
    });

    test('intersection应正确计算相交矩形', () => {
      const rect2 = new Rectangle(15, 15, 20, 20);
      const intersection = rect1.intersection(rect2);
      
      expect(intersection.x).toBe(15);
      expect(intersection.y).toBe(15);
      expect(intersection.width).toBe(15);
      expect(intersection.height).toBe(15);
    });

    test('union应正确计算并集矩形', () => {
      const rect2 = new Rectangle(20, 20, 20, 20);
      const union = rect1.union(rect2);
      
      expect(union.x).toBe(10);
      expect(union.y).toBe(10);
      expect(union.right).toBe(40);
      expect(union.bottom).toBe(40);
    });
  });

  describe('距离计算', () => {
    const rect = new Rectangle(10, 10, 20, 20);

    test('distanceToPoint应正确计算点到矩形的距离', () => {
      const insidePoint = new Vector2(15, 15);
      const outsidePoint = new Vector2(40, 40);
      
      expect(rect.distanceToPoint(insidePoint)).toBe(0);
      expectFloatsEqual(rect.distanceToPoint(outsidePoint), Math.sqrt(200));
    });

    test('closestPointTo应返回最近点', () => {
      const point = new Vector2(5, 25);
      const closest = rect.closestPointTo(point);
      
      expect(closest.x).toBe(10);
      expect(closest.y).toBe(25);
    });
  });

  describe('静态方法', () => {
    test('fromCenter应从中心点创建矩形', () => {
      const rect = Rectangle.fromCenter(50, 60, 20, 30);
      expect(rect.centerX).toBe(50);
      expect(rect.centerY).toBe(60);
      expect(rect.width).toBe(20);
      expect(rect.height).toBe(30);
    });

    test('fromPoints应从两点创建矩形', () => {
      const p1 = new Vector2(10, 20);
      const p2 = new Vector2(30, 15);
      const rect = Rectangle.fromPoints(p1, p2);
      
      expect(rect.x).toBe(10);
      expect(rect.y).toBe(15);
      expect(rect.width).toBe(20);
      expect(rect.height).toBe(5);
    });

    test('fromPointArray应从点数组创建包围矩形', () => {
      const points = [
        new Vector2(5, 10),
        new Vector2(15, 5),
        new Vector2(20, 25),
        new Vector2(8, 30)
      ];
      const rect = Rectangle.fromPointArray(points);
      
      expect(rect.x).toBe(5);
      expect(rect.y).toBe(5);
      expect(rect.right).toBe(20);
      expect(rect.bottom).toBe(30);
    });
  });

  describe('比较操作', () => {
    test('equals应正确比较矩形', () => {
      const rect1 = new Rectangle(1, 2, 3, 4);
      const rect2 = new Rectangle(1, 2, 3, 4);
      const rect3 = new Rectangle(1.001, 2, 3, 4);
      
      expect(rect1.equals(rect2)).toBe(true);
      expect(rect1.equals(rect3, 0.01)).toBe(true);
      expect(rect1.equals(rect3, 0.0001)).toBe(false);
    });
  });

  describe('字符串转换', () => {
    test('toString应返回正确格式', () => {
      const rect = new Rectangle(1.234, 2.567, 3.891, 4.012);
      const str = rect.toString();
      expect(str).toContain('Rectangle');
    });

    test('toArray应返回数组', () => {
      const rect = new Rectangle(1, 2, 3, 4);
      const arr = rect.toArray();
      expect(arr).toEqual([1, 2, 3, 4]);
    });

    test('getVertices应返回四个顶点', () => {
      const rect = new Rectangle(10, 20, 30, 40);
      const vertices = rect.getVertices();
      
      expect(vertices).toHaveLength(4);
      expect(vertices[0].x).toBe(10); // topLeft
      expect(vertices[0].y).toBe(20);
      expect(vertices[1].x).toBe(40); // topRight
      expect(vertices[1].y).toBe(20);
    });
  });
});
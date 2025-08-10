import { Vector2 } from '../src/Vector2';

declare global {
  var expectFloatsEqual: (actual: number, expected: number, epsilon?: number) => void;
}

describe('Vector2', () => {
  describe('构造函数和基础属性', () => {
    test('默认构造函数应创建零向量', () => {
      const v = new Vector2();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });

    test('应正确设置x和y值', () => {
      const v = new Vector2(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });

    test('length属性应正确计算', () => {
      const v = new Vector2(3, 4);
      expect(v.length).toBe(5);
    });

    test('lengthSquared属性应正确计算', () => {
      const v = new Vector2(3, 4);
      expect(v.lengthSquared).toBe(25);
    });

    test('angle属性应正确计算', () => {
      const v = new Vector2(1, 0);
      expect(v.angle).toBe(0);
      
      const v2 = new Vector2(0, 1);
      expectFloatsEqual(v2.angle, Math.PI / 2);
    });
  });

  describe('基础运算', () => {
    test('set方法应正确设置值', () => {
      const v = new Vector2();
      v.set(5, 6);
      expect(v.x).toBe(5);
      expect(v.y).toBe(6);
    });

    test('copy方法应正确复制值', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      v2.copy(v1);
      expect(v2.x).toBe(1);
      expect(v2.y).toBe(2);
    });

    test('clone方法应创建相同的新实例', () => {
      const v1 = new Vector2(1, 2);
      const v2 = v1.clone();
      expect(v2.x).toBe(1);
      expect(v2.y).toBe(2);
      expect(v2).not.toBe(v1);
    });

    test('add方法应正确相加', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      v1.add(v2);
      expect(v1.x).toBe(4);
      expect(v1.y).toBe(6);
    });

    test('subtract方法应正确相减', () => {
      const v1 = new Vector2(5, 7);
      const v2 = new Vector2(2, 3);
      v1.subtract(v2);
      expect(v1.x).toBe(3);
      expect(v1.y).toBe(4);
    });

    test('multiply方法应正确数乘', () => {
      const v = new Vector2(2, 3);
      v.multiply(4);
      expect(v.x).toBe(8);
      expect(v.y).toBe(12);
    });

    test('divide方法应正确数除', () => {
      const v = new Vector2(8, 12);
      v.divide(4);
      expect(v.x).toBe(2);
      expect(v.y).toBe(3);
    });

    test('divide方法应在除以零时抛出错误', () => {
      const v = new Vector2(1, 2);
      expect(() => v.divide(0)).toThrow('不能除以零');
    });
  });

  describe('向量运算', () => {
    test('dot方法应正确计算点积', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      expect(v1.dot(v2)).toBe(11); // 1*3 + 2*4 = 11
    });

    test('cross方法应正确计算叉积', () => {
      const v1 = new Vector2(1, 0);
      const v2 = new Vector2(0, 1);
      expect(v1.cross(v2)).toBe(1);
    });

    test('normalize方法应正确归一化向量', () => {
      const v = new Vector2(3, 4);
      v.normalize();
      expectFloatsEqual(v.length, 1);
      expectFloatsEqual(v.x, 0.6);
      expectFloatsEqual(v.y, 0.8);
    });

    test('零向量归一化应保持不变', () => {
      const v = new Vector2(0, 0);
      v.normalize();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });
  });

  describe('几何运算', () => {
    test('distanceTo方法应正确计算距离', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(3, 4);
      expect(v1.distanceTo(v2)).toBe(5);
    });

    test('angleTo方法应正确计算夹角', () => {
      const v1 = new Vector2(1, 0);
      const v2 = new Vector2(0, 1);
      expectFloatsEqual(v1.angleTo(v2), Math.PI / 2);
    });

    test('projectOnto方法应正确投影', () => {
      const v1 = new Vector2(2, 2);
      const v2 = new Vector2(1, 0);
      const projected = v1.projectOnto(v2);
      expect(projected.x).toBe(2);
      expect(projected.y).toBe(0);
    });
  });

  describe('变换操作', () => {
    test('rotate方法应正确旋转向量', () => {
      const v = new Vector2(1, 0);
      v.rotate(Math.PI / 2);
      expectFloatsEqual(v.x, 0, 1e-10);
      expectFloatsEqual(v.y, 1, 1e-10);
    });

    test('reflect方法应正确反射向量', () => {
      const v = new Vector2(1, 1);
      const normal = new Vector2(0, 1);
      v.reflect(normal);
      expectFloatsEqual(v.x, 1);
      expectFloatsEqual(v.y, -1);
    });
  });

  describe('插值和限制', () => {
    test('lerp方法应正确插值', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(10, 10);
      v1.lerp(v2, 0.5);
      expect(v1.x).toBe(5);
      expect(v1.y).toBe(5);
    });

    test('clampLength方法应正确限制长度', () => {
      const v = new Vector2(6, 8); // 长度为10
      v.clampLength(5);
      expectFloatsEqual(v.length, 5);
    });
  });

  describe('比较操作', () => {
    test('equals方法应正确比较向量', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(1, 2);
      const v3 = new Vector2(1.0001, 2);
      
      expect(v1.equals(v2)).toBe(true);
      expect(v1.equals(v3, 0.001)).toBe(true);
      expect(v1.equals(v3, 0.00001)).toBe(false);
    });

    test('exactEquals方法应检查完全相等', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(1, 2);
      const v3 = new Vector2(1.0001, 2);
      
      expect(v1.exactEquals(v2)).toBe(true);
      expect(v1.exactEquals(v3)).toBe(false);
    });
  });

  describe('静态方法', () => {
    test('Vector2.add应创建新的相加结果', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      const result = Vector2.add(v1, v2);
      
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
      expect(v1.x).toBe(1); // 原向量不变
      expect(v1.y).toBe(2);
    });

    test('Vector2.fromAngle应从角度创建单位向量', () => {
      const v = Vector2.fromAngle(Math.PI / 2);
      expectFloatsEqual(v.x, 0, 1e-10);
      expectFloatsEqual(v.y, 1, 1e-10);
    });

    test('Vector2.fromPolar应从极坐标创建向量', () => {
      const v = Vector2.fromPolar(5, 0);
      expect(v.x).toBe(5);
      expectFloatsEqual(v.y, 0, 1e-10);
    });
  });

  describe('静态常量', () => {
    test('静态常量应具有正确的值', () => {
      expect(Vector2.ZERO.x).toBe(0);
      expect(Vector2.ZERO.y).toBe(0);
      expect(Vector2.ONE.x).toBe(1);
      expect(Vector2.ONE.y).toBe(1);
      expect(Vector2.RIGHT.x).toBe(1);
      expect(Vector2.RIGHT.y).toBe(0);
    });
  });

  describe('字符串转换', () => {
    test('toString应返回正确格式', () => {
      const v = new Vector2(1.2345, 2.6789);
      const str = v.toString();
      expect(str).toContain('1.234');
      expect(str).toContain('2.679');
    });

    test('toArray应返回数组', () => {
      const v = new Vector2(1, 2);
      const arr = v.toArray();
      expect(arr).toEqual([1, 2]);
    });

    test('toObject应返回对象', () => {
      const v = new Vector2(1, 2);
      const obj = v.toObject();
      expect(obj).toEqual({ x: 1, y: 2 });
    });
  });
});
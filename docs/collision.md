# Collision
碰撞检测在大多数游戏中都很常见。框架内使用了一些更先进的碰撞/重叠检查方法，如Minkowski、分离轴定理和古老的三角法

## 线与线相交 [lineToLine]
- 返回是否相交
```typescript
const a1 = new es.Vector2(0, 0);
const a2 = new es.Vector2(100, 100);
const b1 = new es.Vector2(-100, 0);
const b2 = new es.Vector2(100, 200);
const result = es.Collisions.lineToLine(a1, a2, b1, b2);
```
- 返回是否相交并获得相交的点
```typescript
const a1 = new es.Vector2(0, 0);
const a2 = new es.Vector2(100, 100);
const b1 = new es.Vector2(-100, 0);
const b2 = new es.Vector2(100, 200);
// 相交的点坐标
const intersection = new es.Vector2();
const result = es.Collisions.lineToLineIntersection(a1, a2, b1, b2, intersection);
```

## 圆和圆相交 [circleToCircle]
```typescript
const center1 = new es.Vector2(0, 0);
const radius1 = 50;
const center2 = new es.Vector2(30, 30);
const radius2 = 50;
const result = es.Collisions.circleToCircle(center1, radius1, center2, radius2);
```

## 圆和线相交 [circleToLine]
```typescript
const center1 = new es.Vector2(0, 0);
const radius1 = 50;
const a1 = new es.Vector2(0, 0);
const a2 = new es.Vector2(100, 100);
const result = es.Collisions.circleToLine(center1, radius1, a1, a2);
```

## 点是否在圆内 [circleToPoint]
```typescript
const center1 = new es.Vector2(0, 0);
const radius1 = 50;
const point = new es.Vector2(0, 0);
const result = es.Collisions.circleToPoint(center1, radius1, point);
```

## 圆是否和矩形相交 [rectToCircle]
```typescript
const rect = new es.Rectangle(0, 0, 100, 100);
const center = new es.Vector2(30, 30);
const radius = 50;
const result = es.Collisions.rectToCircle(rect, center, radius);
```

## 矩形与线是否相交 [rectToLine]
```typescript
const rect = new es.Rectangle(0, 0, 100, 100);
const a1 = new es.Vector2(0, 0);
const a2 = new es.Vector2(100, 100);
const result = es.Collisions.rectToLine(rect, a1, a2);
```

## 点是否在矩形内 [rectToPoint]
```typescript
const point = new es.Vector2(100, 100);
const result = es.Collisions.rectToPoint(0, 0, 100, 100, point);
```
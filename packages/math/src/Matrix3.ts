import { Vector2 } from './Vector2';

/**
 * 3x3变换矩阵类
 * 
 * 用于2D变换（平移、旋转、缩放）的3x3矩阵
 * 矩阵布局：
 * [m00, m01, m02]   [scaleX * cos, -scaleY * sin, translateX]
 * [m10, m11, m12] = [scaleX * sin,  scaleY * cos, translateY]
 * [m20, m21, m22]   [0,            0,            1]
 */
export class Matrix3 {
  /** 矩阵元素，按行优先存储 */
  public elements: Float32Array;

  /**
   * 创建3x3矩阵
   * @param elements 矩阵元素数组（可选），默认为单位矩阵
   */
  constructor(elements?: ArrayLike<number>) {
    this.elements = new Float32Array(9);
    
    if (elements) {
      this.elements.set(elements);
    } else {
      this.identity();
    }
  }

  // 静态常量
  /** 单位矩阵 */
  static readonly IDENTITY = new Matrix3([
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ]);

  /** 零矩阵 */
  static readonly ZERO = new Matrix3([
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
  ]);

  // 元素访问器

  /** 获取矩阵元素 */
  get(row: number, col: number): number {
    return this.elements[row * 3 + col];
  }

  /** 设置矩阵元素 */
  set(row: number, col: number, value: number): this {
    this.elements[row * 3 + col] = value;
    return this;
  }

  // 快速访问器
  get m00(): number { return this.elements[0]; }
  set m00(value: number) { this.elements[0] = value; }
  
  get m01(): number { return this.elements[1]; }
  set m01(value: number) { this.elements[1] = value; }
  
  get m02(): number { return this.elements[2]; }
  set m02(value: number) { this.elements[2] = value; }
  
  get m10(): number { return this.elements[3]; }
  set m10(value: number) { this.elements[3] = value; }
  
  get m11(): number { return this.elements[4]; }
  set m11(value: number) { this.elements[4] = value; }
  
  get m12(): number { return this.elements[5]; }
  set m12(value: number) { this.elements[5] = value; }
  
  get m20(): number { return this.elements[6]; }
  set m20(value: number) { this.elements[6] = value; }
  
  get m21(): number { return this.elements[7]; }
  set m21(value: number) { this.elements[7] = value; }
  
  get m22(): number { return this.elements[8]; }
  set m22(value: number) { this.elements[8] = value; }

  // 基础操作

  /**
   * 设置矩阵为单位矩阵
   * @returns 当前矩阵实例（链式调用）
   */
  identity(): this {
    this.elements.set([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
    return this;
  }

  /**
   * 设置矩阵为零矩阵
   * @returns 当前矩阵实例（链式调用）
   */
  zero(): this {
    this.elements.fill(0);
    return this;
  }

  /**
   * 复制另一个矩阵的值
   * @param other 源矩阵
   * @returns 当前矩阵实例（链式调用）
   */
  copy(other: Matrix3): this {
    this.elements.set(other.elements);
    return this;
  }

  /**
   * 克隆当前矩阵
   * @returns 新的矩阵实例
   */
  clone(): Matrix3 {
    return new Matrix3(this.elements);
  }

  /**
   * 从数组设置矩阵元素
   * @param elements 矩阵元素数组
   * @returns 当前矩阵实例（链式调用）
   */
  fromArray(elements: ArrayLike<number>): this {
    this.elements.set(elements);
    return this;
  }

  // 矩阵运算

  /**
   * 矩阵加法
   * @param other 另一个矩阵
   * @returns 当前矩阵实例（链式调用）
   */
  add(other: Matrix3): this {
    for (let i = 0; i < 9; i++) {
      this.elements[i] += other.elements[i];
    }
    return this;
  }

  /**
   * 矩阵减法
   * @param other 另一个矩阵
   * @returns 当前矩阵实例（链式调用）
   */
  subtract(other: Matrix3): this {
    for (let i = 0; i < 9; i++) {
      this.elements[i] -= other.elements[i];
    }
    return this;
  }

  /**
   * 矩阵标量乘法
   * @param scalar 标量
   * @returns 当前矩阵实例（链式调用）
   */
  multiplyScalar(scalar: number): this {
    for (let i = 0; i < 9; i++) {
      this.elements[i] *= scalar;
    }
    return this;
  }

  /**
   * 矩阵乘法
   * @param other 另一个矩阵
   * @returns 当前矩阵实例（链式调用）
   */
  multiply(other: Matrix3): this {
    const a = this.elements;
    const b = other.elements;
    const result = new Float32Array(9);

    result[0] = a[0] * b[0] + a[1] * b[3] + a[2] * b[6];
    result[1] = a[0] * b[1] + a[1] * b[4] + a[2] * b[7];
    result[2] = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];

    result[3] = a[3] * b[0] + a[4] * b[3] + a[5] * b[6];
    result[4] = a[3] * b[1] + a[4] * b[4] + a[5] * b[7];
    result[5] = a[3] * b[2] + a[4] * b[5] + a[5] * b[8];

    result[6] = a[6] * b[0] + a[7] * b[3] + a[8] * b[6];
    result[7] = a[6] * b[1] + a[7] * b[4] + a[8] * b[7];
    result[8] = a[6] * b[2] + a[7] * b[5] + a[8] * b[8];

    this.elements.set(result);
    return this;
  }

  /**
   * 左乘另一个矩阵（other * this）
   * @param other 左乘矩阵
   * @returns 当前矩阵实例（链式调用）
   */
  premultiply(other: Matrix3): this {
    const a = other.elements;
    const b = this.elements;
    const result = new Float32Array(9);

    result[0] = a[0] * b[0] + a[1] * b[3] + a[2] * b[6];
    result[1] = a[0] * b[1] + a[1] * b[4] + a[2] * b[7];
    result[2] = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];

    result[3] = a[3] * b[0] + a[4] * b[3] + a[5] * b[6];
    result[4] = a[3] * b[1] + a[4] * b[4] + a[5] * b[7];
    result[5] = a[3] * b[2] + a[4] * b[5] + a[5] * b[8];

    result[6] = a[6] * b[0] + a[7] * b[3] + a[8] * b[6];
    result[7] = a[6] * b[1] + a[7] * b[4] + a[8] * b[7];
    result[8] = a[6] * b[2] + a[7] * b[5] + a[8] * b[8];

    this.elements.set(result);
    return this;
  }

  // 变换操作

  /**
   * 设置为平移矩阵
   * @param x X方向平移
   * @param y Y方向平移
   * @returns 当前矩阵实例（链式调用）
   */
  makeTranslation(x: number, y: number): this {
    this.elements.set([
      1, 0, x,
      0, 1, y,
      0, 0, 1
    ]);
    return this;
  }

  /**
   * 设置为旋转矩阵
   * @param angle 旋转角度（弧度）
   * @returns 当前矩阵实例（链式调用）
   */
  makeRotation(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    this.elements.set([
      cos, -sin, 0,
      sin,  cos, 0,
      0,    0,   1
    ]);
    return this;
  }

  /**
   * 设置为缩放矩阵
   * @param scaleX X方向缩放
   * @param scaleY Y方向缩放
   * @returns 当前矩阵实例（链式调用）
   */
  makeScale(scaleX: number, scaleY: number): this {
    this.elements.set([
      scaleX, 0,      0,
      0,      scaleY, 0,
      0,      0,      1
    ]);
    return this;
  }

  /**
   * 复合平移
   * @param x X方向平移
   * @param y Y方向平移
   * @returns 当前矩阵实例（链式调用）
   */
  translate(x: number, y: number): this {
    this.m02 += this.m00 * x + this.m01 * y;
    this.m12 += this.m10 * x + this.m11 * y;
    return this;
  }

  /**
   * 复合旋转
   * @param angle 旋转角度（弧度）
   * @returns 当前矩阵实例（链式调用）
   */
  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const m00 = this.m00 * cos + this.m01 * sin;
    const m01 = this.m00 * -sin + this.m01 * cos;
    const m10 = this.m10 * cos + this.m11 * sin;
    const m11 = this.m10 * -sin + this.m11 * cos;

    this.m00 = m00;
    this.m01 = m01;
    this.m10 = m10;
    this.m11 = m11;

    return this;
  }

  /**
   * 复合缩放
   * @param scaleX X方向缩放
   * @param scaleY Y方向缩放
   * @returns 当前矩阵实例（链式调用）
   */
  scale(scaleX: number, scaleY: number): this {
    this.m00 *= scaleX;
    this.m01 *= scaleY;
    this.m10 *= scaleX;
    this.m11 *= scaleY;
    return this;
  }

  // 矩阵变换

  /**
   * 矩阵转置
   * @returns 当前矩阵实例（链式调用）
   */
  transpose(): this {
    const elements = this.elements;
    let tmp: number;

    tmp = elements[1]; elements[1] = elements[3]; elements[3] = tmp;
    tmp = elements[2]; elements[2] = elements[6]; elements[6] = tmp;
    tmp = elements[5]; elements[5] = elements[7]; elements[7] = tmp;

    return this;
  }

  /**
   * 计算矩阵行列式
   * @returns 行列式值
   */
  determinant(): number {
    const e = this.elements;
    
    return e[0] * (e[4] * e[8] - e[5] * e[7]) -
           e[1] * (e[3] * e[8] - e[5] * e[6]) +
           e[2] * (e[3] * e[7] - e[4] * e[6]);
  }

  /**
   * 矩阵求逆
   * @returns 当前矩阵实例（链式调用），如果矩阵不可逆则保持不变
   */
  invert(): this {
    const e = this.elements;
    const det = this.determinant();

    if (Math.abs(det) < Number.EPSILON) {
      console.warn('Matrix3: 矩阵不可逆');
      return this;
    }

    const invDet = 1 / det;
    const result = new Float32Array(9);

    result[0] = (e[4] * e[8] - e[5] * e[7]) * invDet;
    result[1] = (e[2] * e[7] - e[1] * e[8]) * invDet;
    result[2] = (e[1] * e[5] - e[2] * e[4]) * invDet;

    result[3] = (e[5] * e[6] - e[3] * e[8]) * invDet;
    result[4] = (e[0] * e[8] - e[2] * e[6]) * invDet;
    result[5] = (e[2] * e[3] - e[0] * e[5]) * invDet;

    result[6] = (e[3] * e[7] - e[4] * e[6]) * invDet;
    result[7] = (e[1] * e[6] - e[0] * e[7]) * invDet;
    result[8] = (e[0] * e[4] - e[1] * e[3]) * invDet;

    this.elements.set(result);
    return this;
  }

  // 向量变换

  /**
   * 变换向量（应用完整的3x3变换）
   * @param vector 向量
   * @returns 新的变换后的向量
   */
  transformVector(vector: Vector2): Vector2 {
    const x = vector.x;
    const y = vector.y;
    const w = this.m20 * x + this.m21 * y + this.m22;

    return new Vector2(
      (this.m00 * x + this.m01 * y + this.m02) / w,
      (this.m10 * x + this.m11 * y + this.m12) / w
    );
  }

  /**
   * 变换向量（仅应用旋转和缩放，忽略平移）
   * @param vector 向量
   * @returns 新的变换后的向量
   */
  transformDirection(vector: Vector2): Vector2 {
    return new Vector2(
      this.m00 * vector.x + this.m01 * vector.y,
      this.m10 * vector.x + this.m11 * vector.y
    );
  }

  /**
   * 批量变换向量数组
   * @param vectors 向量数组
   * @returns 变换后的向量数组
   */
  transformVectors(vectors: Vector2[]): Vector2[] {
    return vectors.map(v => this.transformVector(v));
  }

  // 属性提取

  /**
   * 获取平移分量
   * @returns 平移向量
   */
  getTranslation(): Vector2 {
    return new Vector2(this.m02, this.m12);
  }

  /**
   * 获取旋转角度
   * @returns 旋转角度（弧度）
   */
  getRotation(): number {
    return Math.atan2(this.m10, this.m00);
  }

  /**
   * 获取缩放分量
   * @returns 缩放向量
   */
  getScale(): Vector2 {
    const scaleX = Math.sqrt(this.m00 * this.m00 + this.m10 * this.m10);
    const scaleY = Math.sqrt(this.m01 * this.m01 + this.m11 * this.m11);
    
    // 检查是否有反转
    const det = this.determinant();
    if (det < 0) {
      return new Vector2(-scaleX, scaleY);
    }
    
    return new Vector2(scaleX, scaleY);
  }

  /**
   * 分解变换矩阵为平移、旋转、缩放分量
   * @returns {translation, rotation, scale}
   */
  decompose(): { translation: Vector2; rotation: number; scale: Vector2 } {
    return {
      translation: this.getTranslation(),
      rotation: this.getRotation(),
      scale: this.getScale()
    };
  }

  // 比较操作

  /**
   * 检查两个矩阵是否相等
   * @param other 另一个矩阵
   * @param epsilon 容差，默认为Number.EPSILON
   * @returns 是否相等
   */
  equals(other: Matrix3, epsilon: number = Number.EPSILON): boolean {
    for (let i = 0; i < 9; i++) {
      if (Math.abs(this.elements[i] - other.elements[i]) >= epsilon) {
        return false;
      }
    }
    return true;
  }

  /**
   * 检查两个矩阵是否完全相等
   * @param other 另一个矩阵
   * @returns 是否完全相等
   */
  exactEquals(other: Matrix3): boolean {
    for (let i = 0; i < 9; i++) {
      if (this.elements[i] !== other.elements[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * 检查是否为单位矩阵
   * @param epsilon 容差，默认为Number.EPSILON
   * @returns 是否为单位矩阵
   */
  isIdentity(epsilon: number = Number.EPSILON): boolean {
    return this.equals(Matrix3.IDENTITY, epsilon);
  }

  // 静态方法

  /**
   * 矩阵乘法（静态方法）
   * @param a 矩阵a
   * @param b 矩阵b
   * @returns 新的结果矩阵
   */
  static multiply(a: Matrix3, b: Matrix3): Matrix3 {
    return a.clone().multiply(b);
  }

  /**
   * 创建平移矩阵（静态方法）
   * @param x X方向平移
   * @param y Y方向平移
   * @returns 新的平移矩阵
   */
  static translation(x: number, y: number): Matrix3 {
    return new Matrix3().makeTranslation(x, y);
  }

  /**
   * 创建旋转矩阵（静态方法）
   * @param angle 旋转角度（弧度）
   * @returns 新的旋转矩阵
   */
  static rotation(angle: number): Matrix3 {
    return new Matrix3().makeRotation(angle);
  }

  /**
   * 创建缩放矩阵（静态方法）
   * @param scaleX X方向缩放
   * @param scaleY Y方向缩放
   * @returns 新的缩放矩阵
   */
  static scale(scaleX: number, scaleY: number): Matrix3 {
    return new Matrix3().makeScale(scaleX, scaleY);
  }

  /**
   * 创建TRS（平移-旋转-缩放）变换矩阵
   * @param translation 平移向量
   * @param rotation 旋转角度（弧度）
   * @param scale 缩放向量
   * @returns 新的TRS矩阵
   */
  static TRS(translation: Vector2, rotation: number, scale: Vector2): Matrix3 {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return new Matrix3([
      scale.x * cos, -scale.y * sin, translation.x,
      scale.x * sin,  scale.y * cos, translation.y,
      0,              0,              1
    ]);
  }

  // 字符串转换

  /**
   * 转换为字符串
   * @returns 字符串表示
   */
  toString(): string {
    const e = this.elements;
    return `Matrix3(\n` +
           `  ${e[0].toFixed(3)}, ${e[1].toFixed(3)}, ${e[2].toFixed(3)}\n` +
           `  ${e[3].toFixed(3)}, ${e[4].toFixed(3)}, ${e[5].toFixed(3)}\n` +
           `  ${e[6].toFixed(3)}, ${e[7].toFixed(3)}, ${e[8].toFixed(3)}\n` +
           `)`;
  }

  /**
   * 转换为数组
   * @returns 矩阵元素数组
   */
  toArray(): number[] {
    return Array.from(this.elements);
  }

  /**
   * 转换为CSS transform字符串
   * @returns CSS transform字符串
   */
  toCSSTransform(): string {
    const e = this.elements;
    return `matrix(${e[0]}, ${e[3]}, ${e[1]}, ${e[4]}, ${e[2]}, ${e[5]})`;
  }
}
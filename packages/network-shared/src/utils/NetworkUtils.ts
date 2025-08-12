/**
 * 网络工具函数
 */


/**
 * 生成网络ID
 */
export function generateNetworkId(): number {
  return Math.floor(Math.random() * 0x7FFFFFFF) + 1;
}

/**
 * 生成消息ID
 */
export function generateMessageId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 计算两点之间的距离
 */
export function calculateDistance(
  pos1: { x: number; y: number; z?: number },
  pos2: { x: number; y: number; z?: number }
): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = (pos1.z || 0) - (pos2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 检查环境是否为 Node.js
 */
export function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && process.versions && !!process.versions.node;
}

/**
 * 检查环境是否为浏览器
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * 获取时间戳（毫秒）
 */
export function getTimestamp(): number {
  return Date.now();
}

/**
 * 获取高精度时间戳（如果可用）
 */
export function getHighResTimestamp(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
}

/**
 * 限制调用频率
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  let context: any;
  
  return (function(this: any, ...args: any[]) {
    context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  let context: any;
  
  return (function(this: any, ...args: any[]) {
    context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  }) as T;
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }

  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * 检查对象是否为空
 */
export function isEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 格式化延迟时间
 */
export function formatLatency(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  } else {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  }
}

/**
 * 获取网络质量描述
 */
export function getNetworkQuality(latency: number, packetLoss: number): string {
  if (latency < 50 && packetLoss < 1) return 'Excellent';
  if (latency < 100 && packetLoss < 2) return 'Good';
  if (latency < 200 && packetLoss < 5) return 'Fair';
  if (latency < 500 && packetLoss < 10) return 'Poor';
  return 'Very Poor';
}

/**
 * 计算网络统计平均值
 */
export function calculateNetworkAverage(values: number[], maxSamples = 100): number {
  if (values.length === 0) return 0;
  
  // 保留最近的样本
  const samples = values.slice(-maxSamples);
  const sum = samples.reduce((acc, val) => acc + val, 0);
  return sum / samples.length;
}

/**
 * 验证网络配置
 */
export function validateNetworkConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof config.port !== 'number' || config.port <= 0 || config.port > 65535) {
    errors.push('Port must be a number between 1 and 65535');
  }

  if (typeof config.host !== 'string' || config.host.length === 0) {
    errors.push('Host must be a non-empty string');
  }

  if (typeof config.maxConnections !== 'number' || config.maxConnections <= 0) {
    errors.push('Max connections must be a positive number');
  }

  if (typeof config.syncRate !== 'number' || config.syncRate <= 0) {
    errors.push('Sync rate must be a positive number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}
import { DemoBase } from './DemoBase';
import { SerializationDemo } from './SerializationDemo';
import { WorkerSystemDemo } from './WorkerSystemDemo';

export { DemoBase, SerializationDemo, WorkerSystemDemo };

// Demo注册表
export const DEMO_REGISTRY: typeof DemoBase[] = [
    SerializationDemo,
    WorkerSystemDemo,
    // 更多demos可以在这里添加
];

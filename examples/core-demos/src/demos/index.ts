import { DemoBase } from './DemoBase';
import { SerializationDemo } from './SerializationDemo';
import { IncrementalSerializationDemo } from './IncrementalSerializationDemo';
import { WorkerSystemDemo } from './WorkerSystemDemo';

export { DemoBase, SerializationDemo, IncrementalSerializationDemo, WorkerSystemDemo };

// Demo注册表
export const DEMO_REGISTRY: typeof DemoBase[] = [
    SerializationDemo,
    IncrementalSerializationDemo,
    WorkerSystemDemo
];

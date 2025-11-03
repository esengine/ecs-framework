import { useRef, useState } from 'react';
import { BehaviorTreeExecutor } from '../../utils/BehaviorTreeExecutor';

export function useEditorState() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const stopExecutionRef = useRef<(() => void) | null>(null);
    const executorRef = useRef<BehaviorTreeExecutor | null>(null);

    const [selectedConnection, setSelectedConnection] = useState<{from: string; to: string} | null>(null);

    return {
        canvasRef,
        stopExecutionRef,
        executorRef,
        selectedConnection,
        setSelectedConnection
    };
}

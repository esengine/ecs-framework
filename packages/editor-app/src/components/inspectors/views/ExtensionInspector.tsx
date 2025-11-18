import { InspectorRegistry, InspectorContext } from '@esengine/editor-core';
import { EmptyInspector } from './EmptyInspector';

interface ExtensionInspectorProps {
    data: unknown;
    inspectorRegistry: InspectorRegistry;
    projectPath?: string | null;
}

export function ExtensionInspector({ data, inspectorRegistry, projectPath }: ExtensionInspectorProps) {
    const context: InspectorContext = {
        target: data,
        projectPath,
        readonly: false
    };

    const extensionContent = inspectorRegistry.render(data, context);
    if (extensionContent) {
        return extensionContent;
    }

    return (
        <EmptyInspector
            message="未找到合适的检视器"
            description="此对象类型未注册检视器扩展"
        />
    );
}

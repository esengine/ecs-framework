import React from 'react';
import { IFieldEditor, FieldEditorProps, MessageHub, FileActionRegistry } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';
import { AssetField } from '../../components/inspectors/fields/AssetField';

export class AssetFieldEditor implements IFieldEditor<string | null> {
    readonly type = 'asset';
    readonly name = 'Asset Field Editor';
    readonly priority = 100;

    canHandle(fieldType: string): boolean {
        return fieldType === 'asset' || fieldType === 'assetReference' || fieldType === 'resourcePath';
    }

    render({ label, value, onChange, context }: FieldEditorProps<string | null>): React.ReactElement {
        const fileExtension = context.metadata?.fileExtension || '';
        const placeholder = context.metadata?.placeholder || '拖拽或选择资源文件';

        const handleNavigate = (path: string) => {
            const messageHub = Core.services.tryResolve(MessageHub);
            if (messageHub) {
                messageHub.publish('asset:reveal', { path });
            }
        };

        // 从 FileActionRegistry 获取资产创建消息映射
        const fileActionRegistry = Core.services.tryResolve(FileActionRegistry);
        const creationMapping = fileActionRegistry?.getAssetCreationMapping(fileExtension);

        const handleCreate = () => {
            const messageHub = Core.services.tryResolve(MessageHub);
            if (messageHub && creationMapping) {
                messageHub.publish(creationMapping.createMessage, {
                    entityId: context.metadata?.entityId,
                    onChange
                });
            }
        };

        const canCreate = creationMapping !== null && creationMapping !== undefined;

        return (
            <AssetField
                label={label}
                value={value}
                onChange={onChange}
                fileExtension={fileExtension}
                placeholder={placeholder}
                readonly={context.readonly}
                onNavigate={handleNavigate}
                onCreate={canCreate ? handleCreate : undefined}
            />
        );
    }
}

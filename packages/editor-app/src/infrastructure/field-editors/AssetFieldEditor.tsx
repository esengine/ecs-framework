import React from 'react';
import { IFieldEditor, FieldEditorProps, MessageHub } from '@esengine/editor-core';
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

        const handleCreate = () => {
            const messageHub = Core.services.tryResolve(MessageHub);
            if (messageHub) {
                if (fileExtension === '.tilemap.json') {
                    messageHub.publish('tilemap:create-asset', {
                        entityId: context.metadata?.entityId,
                        onChange
                    });
                } else if (fileExtension === '.btree') {
                    messageHub.publish('behavior-tree:create-asset', {
                        entityId: context.metadata?.entityId,
                        onChange
                    });
                }
            }
        };

        const canCreate = ['.tilemap.json', '.btree'].includes(fileExtension);

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

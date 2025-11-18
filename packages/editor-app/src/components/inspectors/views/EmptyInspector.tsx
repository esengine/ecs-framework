import { FileSearch } from 'lucide-react';

interface EmptyInspectorProps {
    message?: string;
    description?: string;
}

export function EmptyInspector({
    message = '未选择对象',
    description = '选择实体或节点以查看详细信息'
}: EmptyInspectorProps) {
    return (
        <div className="entity-inspector">
            <div className="empty-inspector">
                <FileSearch size={48} style={{ color: '#555', marginBottom: '16px' }} />
                <div style={{ color: '#999', fontSize: '14px' }}>{message}</div>
                <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                    {description}
                </div>
            </div>
        </div>
    );
}

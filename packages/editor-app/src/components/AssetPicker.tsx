import { useState, useEffect } from 'react';
import { RefreshCw, Folder } from 'lucide-react';
import { TauriAPI } from '../api/tauri';

interface AssetPickerProps {
  value: string;
  onChange: (value: string) => void;
  projectPath: string | null;
  filter?: 'btree' | 'ecs';
  label?: string;
}

/**
 * 资产选择器组件
 * 用于选择项目中的资产文件
 */
export function AssetPicker({ value, onChange, projectPath, filter = 'btree', label }: AssetPickerProps) {
    const [assets, setAssets] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (projectPath) {
            loadAssets();
        }
    }, [projectPath]);

    const loadAssets = async () => {
        if (!projectPath) return;

        setLoading(true);
        try {
            if (filter === 'btree') {
                const btrees = await TauriAPI.scanBehaviorTrees(projectPath);
                setAssets(btrees);
            }
        } catch (error) {
            console.error('Failed to load assets:', error);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBrowse = async () => {
        try {
            if (filter === 'btree') {
                const path = await TauriAPI.openBehaviorTreeDialog();
                if (path && projectPath) {
                    const behaviorsPath = `${projectPath}\\.ecs\\behaviors\\`.replace(/\\/g, '\\\\');
                    const relativePath = path.replace(behaviorsPath, '')
                        .replace(/\\/g, '/')
                        .replace('.btree', '');
                    onChange(relativePath);
                    await loadAssets();
                }
            }
        } catch (error) {
            console.error('Failed to browse asset:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {label && (
                <label style={{ fontSize: '11px', color: '#aaa', fontWeight: '500' }}>
                    {label}
                </label>
            )}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={loading || !projectPath}
                    style={{
                        flex: 1,
                        padding: '4px 8px',
                        backgroundColor: '#1e1e1e',
                        border: '1px solid #3e3e42',
                        borderRadius: '3px',
                        color: '#cccccc',
                        fontSize: '12px',
                        cursor: loading || !projectPath ? 'not-allowed' : 'pointer'
                    }}
                >
                    <option value="">{loading ? '加载中...' : '选择资产...'}</option>
                    {assets.map((asset) => (
                        <option key={asset} value={asset}>
                            {asset}
                        </option>
                    ))}
                </select>
                <button
                    onClick={loadAssets}
                    disabled={loading || !projectPath}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: '#0e639c',
                        border: 'none',
                        borderRadius: '3px',
                        color: '#fff',
                        cursor: loading || !projectPath ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: loading || !projectPath ? 0.5 : 1
                    }}
                    title="刷新资产列表"
                >
                    <RefreshCw size={14} />
                </button>
                <button
                    onClick={handleBrowse}
                    disabled={loading || !projectPath}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: '#0e639c',
                        border: 'none',
                        borderRadius: '3px',
                        color: '#fff',
                        cursor: loading || !projectPath ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: loading || !projectPath ? 0.5 : 1
                    }}
                    title="浏览文件..."
                >
                    <Folder size={14} />
                </button>
            </div>
            {!projectPath && (
                <div style={{ fontSize: '10px', color: '#ff6b6b', marginTop: '2px' }}>
          未加载项目
                </div>
            )}
            {value && assets.length > 0 && !assets.includes(value) && (
                <div style={{ fontSize: '10px', color: '#ffa726', marginTop: '2px' }}>
          警告: 资产 "{value}" 不存在于项目中
                </div>
            )}
        </div>
    );
}

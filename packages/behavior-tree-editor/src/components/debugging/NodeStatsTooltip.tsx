import React from 'react';
import { NodeExecutionStats } from '../../stores/ExecutionStatsStore';

interface NodeStatsTooltipProps {
    stats: NodeExecutionStats;
    show: boolean;
    position: { x: number; y: number };
}

/**
 * 节点统计信息工具提示
 */
export const NodeStatsTooltip: React.FC<NodeStatsTooltipProps> = ({ stats, show, position }) => {
    if (!show) return null;

    const successRate = stats.totalExecutions > 0
        ? ((stats.successCount / stats.totalExecutions) * 100).toFixed(1)
        : '0.0';

    return (
        <div
            style={{
                position: 'fixed',
                left: position.x + 10,
                top: position.y + 10,
                backgroundColor: '#1e1e1e',
                border: '1px solid #3f3f3f',
                borderRadius: '6px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 10000,
                minWidth: '220px',
                fontSize: '12px',
                color: '#ccc',
                pointerEvents: 'none'
            }}
        >
            <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '8px',
                borderBottom: '1px solid #3f3f3f',
                paddingBottom: '6px'
            }}>
                📊 执行统计
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <StatRow label="总执行次数" value={stats.totalExecutions.toString()} />
                <StatRow
                    label="成功率"
                    value={`${successRate}%`}
                    valueColor={parseFloat(successRate) > 80 ? '#4caf50' : parseFloat(successRate) > 50 ? '#ff9800' : '#f44336'}
                />
                <StatRow label="成功" value={stats.successCount.toString()} valueColor="#4caf50" />
                <StatRow label="失败" value={stats.failureCount.toString()} valueColor="#f44336" />
                <StatRow label="运行中" value={stats.runningCount.toString()} valueColor="#2196f3" />

                {stats.totalExecutions > 0 && (
                    <>
                        <div style={{ height: '1px', background: '#3f3f3f', margin: '6px 0' }} />
                        <StatRow
                            label="平均耗时"
                            value={`${stats.averageDuration.toFixed(2)}ms`}
                        />
                        <StatRow
                            label="最小耗时"
                            value={`${stats.minDuration === Infinity ? 0 : stats.minDuration.toFixed(2)}ms`}
                            valueColor="#4caf50"
                        />
                        <StatRow
                            label="最大耗时"
                            value={`${stats.maxDuration.toFixed(2)}ms`}
                            valueColor="#ff9800"
                        />
                    </>
                )}

                {stats.lastExecutionTime > 0 && (
                    <>
                        <div style={{ height: '1px', background: '#3f3f3f', margin: '6px 0' }} />
                        <StatRow
                            label="最后执行"
                            value={new Date(stats.lastExecutionTime).toLocaleTimeString()}
                        />
                        <StatRow
                            label="最后状态"
                            value={stats.lastStatus}
                            valueColor={
                                stats.lastStatus === 'success' ? '#4caf50' :
                                stats.lastStatus === 'failure' ? '#f44336' :
                                stats.lastStatus === 'running' ? '#2196f3' : '#666'
                            }
                        />
                    </>
                )}
            </div>
        </div>
    );
};

interface StatRowProps {
    label: string;
    value: string;
    valueColor?: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, valueColor }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }}>
        <span style={{ color: '#999' }}>{label}:</span>
        <span style={{
            color: valueColor || '#fff',
            fontWeight: 500,
            fontFamily: 'monospace'
        }}>
            {value}
        </span>
    </div>
);

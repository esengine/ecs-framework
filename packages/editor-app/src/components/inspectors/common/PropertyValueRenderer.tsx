import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatNumber } from '../utils';

export interface PropertyValueRendererProps {
    name: string;
    value: unknown;
    depth: number;
    decimalPlaces?: number;
}

export function PropertyValueRenderer({ name, value, depth, decimalPlaces = 4 }: PropertyValueRendererProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const isExpandable = value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
    const isArray = Array.isArray(value);

    const renderSimpleValue = (val: unknown): string => {
        if (val === null || val === undefined) return 'null';
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (typeof val === 'number') return formatNumber(val, decimalPlaces);
        if (typeof val === 'string') return val.length > 50 ? val.substring(0, 50) + '...' : val;
        if (Array.isArray(val)) return `Array(${val.length})`;
        if (typeof val === 'object') {
            const obj = val as Record<string, unknown>;
            const keys = Object.keys(obj);
            if (keys.length === 0) return '{}';
            if (keys.length <= 2) {
                const preview = keys
                    .map((k) => {
                        const v = obj[k];
                        return `${k}: ${typeof v === 'object' ? '...' : typeof v === 'number' ? formatNumber(v, decimalPlaces) : String(v)}`;
                    })
                    .join(', ');
                return `{${preview}}`;
            }
            return `{${keys.slice(0, 2).join(', ')}...}`;
        }
        return String(val);
    };

    if (isExpandable) {
        return (
            <div style={{ marginLeft: depth > 0 ? '12px' : 0 }}>
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 0',
                        fontSize: '11px',
                        borderBottom: '1px solid #333',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <span style={{ color: '#9cdcfe', marginLeft: '4px' }}>{name}</span>
                    {!isExpanded && (
                        <span
                            style={{
                                color: '#666',
                                fontFamily: 'monospace',
                                marginLeft: '8px',
                                fontSize: '10px'
                            }}
                        >
                            {renderSimpleValue(value)}
                        </span>
                    )}
                </div>
                {isExpanded && (
                    <div style={{ marginLeft: '8px', borderLeft: '1px solid #444', paddingLeft: '8px' }}>
                        {Object.entries(value).map(([key, val]) => (
                            <PropertyValueRenderer
                                key={key}
                                name={key}
                                value={val}
                                depth={depth + 1}
                                decimalPlaces={decimalPlaces}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (isArray && value.length > 0) {
        return (
            <div style={{ marginLeft: depth > 0 ? '12px' : 0 }}>
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 0',
                        fontSize: '11px',
                        borderBottom: '1px solid #333',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <span style={{ color: '#9cdcfe', marginLeft: '4px' }}>{name}</span>
                    <span
                        style={{
                            color: '#666',
                            fontFamily: 'monospace',
                            marginLeft: '8px',
                            fontSize: '10px'
                        }}
                    >
                        Array({value.length})
                    </span>
                </div>
                {isExpanded && (
                    <div style={{ marginLeft: '8px', borderLeft: '1px solid #444', paddingLeft: '8px' }}>
                        {value.map((item, index: number) => (
                            <PropertyValueRenderer
                                key={index}
                                name={`[${index}]`}
                                value={item}
                                depth={depth + 1}
                                decimalPlaces={decimalPlaces}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '3px 0',
                fontSize: '11px',
                borderBottom: '1px solid #333',
                marginLeft: depth > 0 ? '12px' : 0
            }}
        >
            <span style={{ color: '#9cdcfe' }}>{name}</span>
            <span
                style={{
                    color:
                        typeof value === 'boolean'
                            ? value
                                ? '#4ade80'
                                : '#f87171'
                            : typeof value === 'number'
                              ? '#b5cea8'
                              : '#ce9178',
                    fontFamily: 'monospace',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}
            >
                {renderSimpleValue(value)}
            </span>
        </div>
    );
}

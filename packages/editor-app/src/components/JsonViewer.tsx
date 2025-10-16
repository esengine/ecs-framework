import { useState } from 'react';
import { X, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import '../styles/JsonViewer.css';

interface JsonViewerProps {
    data: any;
    onClose: () => void;
}

export function JsonViewer({ data, onClose }: JsonViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="json-viewer-overlay" onClick={onClose}>
            <div className="json-viewer-modal" onClick={(e) => e.stopPropagation()}>
                <div className="json-viewer-header">
                    <h3>JSON Viewer</h3>
                    <div className="json-viewer-actions">
                        <button
                            className="json-viewer-btn"
                            onClick={handleCopy}
                            title="Copy JSON"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button
                            className="json-viewer-btn"
                            onClick={onClose}
                            title="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div className="json-viewer-content">
                    <JsonTree data={data} name="root" />
                </div>
            </div>
        </div>
    );
}

interface JsonTreeProps {
    data: any;
    name: string;
    level?: number;
}

function JsonTree({ data, name, level = 0 }: JsonTreeProps) {
    const [expanded, setExpanded] = useState(level < 2);

    const getValueType = (value: any): string => {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    };

    const getValueColor = (type: string): string => {
        switch (type) {
            case 'string': return 'json-string';
            case 'number': return 'json-number';
            case 'boolean': return 'json-boolean';
            case 'null': return 'json-null';
            case 'array': return 'json-array';
            case 'object': return 'json-object';
            default: return '';
        }
    };

    const renderValue = (value: any): JSX.Element => {
        const type = getValueType(value);
        const colorClass = getValueColor(type);

        if (type === 'object' || type === 'array') {
            const isArray = Array.isArray(value);
            const keys = Object.keys(value);
            const preview = isArray
                ? `Array(${value.length})`
                : `Object {${keys.length} ${keys.length === 1 ? 'key' : 'keys'}}`;

            return (
                <div className="json-tree-node">
                    <div
                        className="json-tree-header"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <span className="json-tree-expander">
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                        <span className="json-tree-key">{name}:</span>
                        <span className={`json-tree-preview ${colorClass}`}>
                            {preview}
                        </span>
                    </div>
                    {expanded && (
                        <div className="json-tree-children">
                            {isArray ? (
                                value.map((item: any, index: number) => (
                                    <JsonTree
                                        key={index}
                                        data={item}
                                        name={`[${index}]`}
                                        level={level + 1}
                                    />
                                ))
                            ) : (
                                Object.entries(value).map(([key, val]) => (
                                    <JsonTree
                                        key={key}
                                        data={val}
                                        name={key}
                                        level={level + 1}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="json-tree-leaf">
                <span className="json-tree-key">{name}:</span>
                <span className={`json-tree-value ${colorClass}`}>
                    {type === 'string' ? `"${value}"` : String(value)}
                </span>
            </div>
        );
    };

    return renderValue(data);
}

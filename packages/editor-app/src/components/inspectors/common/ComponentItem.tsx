import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PropertyValueRenderer } from './PropertyValueRenderer';

export interface ComponentItemProps {
    component: {
        typeName: string;
        properties: Record<string, any>;
    };
    decimalPlaces?: number;
}

export function ComponentItem({ component, decimalPlaces = 4 }: ComponentItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            style={{
                marginBottom: '2px',
                backgroundColor: '#2a2a2a',
                borderRadius: '4px',
                overflow: 'hidden'
            }}
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 8px',
                    backgroundColor: '#3a3a3a',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: isExpanded ? '1px solid #4a4a4a' : 'none'
                }}
            >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span
                    style={{
                        marginLeft: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#e0e0e0'
                    }}
                >
                    {component.typeName}
                </span>
            </div>

            {isExpanded && (
                <div style={{ padding: '6px 8px' }}>
                    {Object.entries(component.properties).map(([propName, propValue]) => (
                        <PropertyValueRenderer
                            key={propName}
                            name={propName}
                            value={propValue}
                            depth={0}
                            decimalPlaces={decimalPlaces}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

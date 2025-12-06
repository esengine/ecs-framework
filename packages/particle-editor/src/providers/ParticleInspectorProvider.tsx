/**
 * 粒子系统 Inspector Provider
 * Particle System Inspector Provider
 */

import React, { useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import type { IInspectorProvider, InspectorContext } from '@esengine/editor-core';
import type { ParticleSystemComponent } from '@esengine/particle';
import { EmissionShape, ParticleBlendMode } from '@esengine/particle';

interface ParticleInspectorData {
    entityId: string;
    component: ParticleSystemComponent;
}

export class ParticleInspectorProvider implements IInspectorProvider<ParticleInspectorData> {
    readonly id = 'particle-system-inspector';
    readonly name = 'Particle System Inspector';
    readonly priority = 100;

    canHandle(target: unknown): target is ParticleInspectorData {
        if (typeof target !== 'object' || target === null) return false;
        const obj = target as Record<string, unknown>;
        return 'entityId' in obj && 'component' in obj &&
            obj.component !== null &&
            typeof obj.component === 'object' &&
            'maxParticles' in (obj.component as Record<string, unknown>) &&
            'emissionRate' in (obj.component as Record<string, unknown>);
    }

    render(data: ParticleInspectorData, _context: InspectorContext): React.ReactElement {
        return <ParticleInspectorUI data={data} />;
    }
}

interface ParticleInspectorUIProps {
    data: ParticleInspectorData;
}

function ParticleInspectorUI({ data }: ParticleInspectorUIProps) {
    const { component } = data;
    const [, forceUpdate] = useState({});
    const [showAdvanced, setShowAdvanced] = useState(false);

    const refresh = useCallback(() => forceUpdate({}), []);

    const handlePlay = () => {
        component.play();
        refresh();
    };

    const handlePause = () => {
        component.pause();
        refresh();
    };

    const handleStop = () => {
        component.stop(true);
        refresh();
    };

    const handleBurst = () => {
        component.burst(10);
        refresh();
    };

    const handleChange = <K extends keyof ParticleSystemComponent>(
        key: K,
        value: ParticleSystemComponent[K]
    ) => {
        (component as any)[key] = value;
        component.markDirty();
        refresh();
    };

    const hasAsset = !!component.particleAssetGuid;

    return (
        <div className="entity-inspector">
            {/* 资产选择 | Asset Selection - 最重要，放在最上面 */}
            <div className="inspector-section">
                <div className="section-title">Particle Asset</div>
                <AssetInput
                    value={component.particleAssetGuid}
                    extensions={['.particle', '.particle.json']}
                    placeholder="Select particle asset..."
                    onChange={v => handleChange('particleAssetGuid', v)}
                />
                {hasAsset && (
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted, #888)',
                        marginTop: '4px',
                        fontStyle: 'italic'
                    }}>
                        Using settings from particle asset file
                    </div>
                )}
            </div>

            {/* 控制按钮 | Control buttons */}
            <div className="inspector-section">
                <div className="section-title">Controls</div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    <button
                        onClick={component.isPlaying ? handlePause : handlePlay}
                        style={buttonStyle}
                        title={component.isPlaying ? 'Pause' : 'Play'}
                    >
                        {component.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={handleStop} style={buttonStyle} title="Stop">
                        <RotateCcw size={14} />
                    </button>
                    <button onClick={handleBurst} style={buttonStyle} title="Burst 10">
                        <Sparkles size={14} />
                    </button>
                </div>
                <div className="property-row">
                    <label>Active Particles</label>
                    <span>{component.activeParticleCount} / {component.maxParticles}</span>
                </div>
            </div>

            {/* 高级属性折叠区域 | Advanced properties (collapsible) */}
            {!hasAsset && (
                <div className="inspector-section">
                    <div
                        className="section-title"
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            userSelect: 'none'
                        }}
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        Inline Settings
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted, #888)',
                        marginBottom: '8px'
                    }}>
                        These settings are used when no asset is selected
                    </div>

                    {showAdvanced && (
                        <>
                            {/* 基础属性 | Basic Properties */}
                            <CollapsibleSection title="Basic" defaultOpen>
                                <NumberInput
                                    label="Max Particles"
                                    value={component.maxParticles}
                                    min={1}
                                    max={10000}
                                    step={100}
                                    onChange={v => handleChange('maxParticles', v)}
                                />

                                <CheckboxInput
                                    label="Looping"
                                    checked={component.looping}
                                    onChange={v => handleChange('looping', v)}
                                />

                                <NumberInput
                                    label="Duration"
                                    value={component.duration}
                                    min={0.1}
                                    step={0.1}
                                    onChange={v => handleChange('duration', v)}
                                />

                                <NumberInput
                                    label="Playback Speed"
                                    value={component.playbackSpeed}
                                    min={0.01}
                                    max={10}
                                    step={0.1}
                                    onChange={v => handleChange('playbackSpeed', v)}
                                />
                            </CollapsibleSection>

                            {/* 发射属性 | Emission Properties */}
                            <CollapsibleSection title="Emission">
                                <NumberInput
                                    label="Emission Rate"
                                    value={component.emissionRate}
                                    min={0}
                                    step={1}
                                    onChange={v => handleChange('emissionRate', v)}
                                />

                                <SelectInput
                                    label="Shape"
                                    value={component.emissionShape}
                                    options={[
                                        { value: EmissionShape.Point, label: 'Point' },
                                        { value: EmissionShape.Circle, label: 'Circle (filled)' },
                                        { value: EmissionShape.Ring, label: 'Ring (edge)' },
                                        { value: EmissionShape.Rectangle, label: 'Rectangle (filled)' },
                                        { value: EmissionShape.Edge, label: 'Edge (rect outline)' },
                                        { value: EmissionShape.Line, label: 'Line' },
                                        { value: EmissionShape.Cone, label: 'Cone' },
                                    ]}
                                    onChange={v => handleChange('emissionShape', v as EmissionShape)}
                                />

                                {component.emissionShape !== EmissionShape.Point && (
                                    <NumberInput
                                        label="Shape Radius"
                                        value={component.shapeRadius}
                                        min={0}
                                        step={1}
                                        onChange={v => handleChange('shapeRadius', v)}
                                    />
                                )}
                            </CollapsibleSection>

                            {/* 粒子属性 | Particle Properties */}
                            <CollapsibleSection title="Particle">
                                <RangeInput
                                    label="Lifetime"
                                    minValue={component.lifetimeMin}
                                    maxValue={component.lifetimeMax}
                                    min={0.01}
                                    step={0.1}
                                    onMinChange={v => handleChange('lifetimeMin', v)}
                                    onMaxChange={v => handleChange('lifetimeMax', v)}
                                />

                                <RangeInput
                                    label="Speed"
                                    minValue={component.speedMin}
                                    maxValue={component.speedMax}
                                    min={0}
                                    step={1}
                                    onMinChange={v => handleChange('speedMin', v)}
                                    onMaxChange={v => handleChange('speedMax', v)}
                                />

                                <NumberInput
                                    label="Direction (°)"
                                    value={component.direction}
                                    min={-180}
                                    max={180}
                                    step={1}
                                    onChange={v => handleChange('direction', v)}
                                />

                                <NumberInput
                                    label="Spread (°)"
                                    value={component.directionSpread}
                                    min={0}
                                    max={360}
                                    step={1}
                                    onChange={v => handleChange('directionSpread', v)}
                                />

                                <RangeInput
                                    label="Scale"
                                    minValue={component.scaleMin}
                                    maxValue={component.scaleMax}
                                    min={0.01}
                                    step={0.1}
                                    onMinChange={v => handleChange('scaleMin', v)}
                                    onMaxChange={v => handleChange('scaleMax', v)}
                                />

                                <NumberInput
                                    label="Gravity X"
                                    value={component.gravityX}
                                    step={1}
                                    onChange={v => handleChange('gravityX', v)}
                                />

                                <NumberInput
                                    label="Gravity Y"
                                    value={component.gravityY}
                                    step={1}
                                    onChange={v => handleChange('gravityY', v)}
                                />
                            </CollapsibleSection>

                            {/* 颜色属性 | Color Properties */}
                            <CollapsibleSection title="Color">
                                <ColorInput
                                    label="Start Color"
                                    value={component.startColor}
                                    onChange={v => handleChange('startColor', v)}
                                />

                                <NumberInput
                                    label="Start Alpha"
                                    value={component.startAlpha}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onChange={v => handleChange('startAlpha', v)}
                                />

                                <NumberInput
                                    label="End Alpha"
                                    value={component.endAlpha}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onChange={v => handleChange('endAlpha', v)}
                                />

                                <NumberInput
                                    label="End Scale"
                                    value={component.endScale}
                                    min={0}
                                    step={0.1}
                                    onChange={v => handleChange('endScale', v)}
                                />
                            </CollapsibleSection>

                            {/* 渲染属性 | Rendering Properties */}
                            <CollapsibleSection title="Rendering">
                                <NumberInput
                                    label="Particle Size"
                                    value={component.particleSize}
                                    min={1}
                                    step={1}
                                    onChange={v => handleChange('particleSize', v)}
                                />

                                <SelectInput
                                    label="Blend Mode"
                                    value={component.blendMode}
                                    options={[
                                        { value: ParticleBlendMode.Normal, label: 'Normal' },
                                        { value: ParticleBlendMode.Additive, label: 'Additive' },
                                        { value: ParticleBlendMode.Multiply, label: 'Multiply' },
                                    ]}
                                    onChange={v => handleChange('blendMode', v as ParticleBlendMode)}
                                />

                                <NumberInput
                                    label="Sorting Order"
                                    value={component.sortingOrder}
                                    step={1}
                                    onChange={v => handleChange('sortingOrder', v)}
                                />
                            </CollapsibleSection>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ============= UI Components =============

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '4px 8px',
    border: '1px solid var(--border-color, #3a3a3a)',
    borderRadius: '4px',
    background: 'var(--input-background, #2a2a2a)',
    color: 'var(--text-color, #e0e0e0)',
    fontSize: '12px',
};

const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    border: 'none',
    borderRadius: '4px',
    background: 'var(--button-background, #3a3a3a)',
    color: 'var(--text-color, #e0e0e0)',
    cursor: 'pointer',
    fontSize: '12px',
};

// ============= Collapsible Section =============

interface CollapsibleSectionProps {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div style={{ marginBottom: '8px' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: '4px 0',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-color, #e0e0e0)',
                    userSelect: 'none',
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {title}
            </div>
            {isOpen && (
                <div style={{ paddingLeft: '16px' }}>
                    {children}
                </div>
            )}
        </div>
    );
}

// ============= Asset Input =============

interface AssetInputProps {
    value: string;
    extensions: string[];
    placeholder?: string;
    onChange: (value: string) => void;
}

function AssetInput({ value, extensions, placeholder = 'None', onChange }: AssetInputProps) {
    const displayValue = value || placeholder;
    const hasValue = !!value;

    return (
        <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
                <input
                    type="text"
                    value={displayValue}
                    placeholder={placeholder}
                    readOnly
                    style={{
                        ...inputStyle,
                        flex: 1,
                        color: hasValue ? 'var(--text-color, #e0e0e0)' : 'var(--text-muted, #888)',
                    }}
                    title={value || placeholder}
                />
                {hasValue && (
                    <button
                        onClick={() => onChange('')}
                        style={{
                            ...buttonStyle,
                            padding: '4px 8px',
                        }}
                        title="Clear"
                    >
                        ×
                    </button>
                )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>
                Drag & drop a {extensions.join(' or ')} file here
            </div>
        </div>
    );
}

// ============= Number Input =============

interface NumberInputProps {
    label: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: number) => void;
}

function NumberInput({ label, value, min, max, step = 1, onChange }: NumberInputProps) {
    return (
        <div className="property-row">
            <label>{label}</label>
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                style={inputStyle}
            />
        </div>
    );
}

// ============= Range Input =============

interface RangeInputProps {
    label: string;
    minValue: number;
    maxValue: number;
    min?: number;
    max?: number;
    step?: number;
    onMinChange: (value: number) => void;
    onMaxChange: (value: number) => void;
}

function RangeInput({ label, minValue, maxValue, min, max, step = 1, onMinChange, onMaxChange }: RangeInputProps) {
    return (
        <div className="property-row">
            <label>{label}</label>
            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                <input
                    type="number"
                    value={minValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={e => onMinChange(parseFloat(e.target.value) || 0)}
                    style={{ ...inputStyle, width: '50%' }}
                    title="Min"
                />
                <input
                    type="number"
                    value={maxValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={e => onMaxChange(parseFloat(e.target.value) || 0)}
                    style={{ ...inputStyle, width: '50%' }}
                    title="Max"
                />
            </div>
        </div>
    );
}

// ============= Checkbox Input =============

interface CheckboxInputProps {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

function CheckboxInput({ label, checked, onChange }: CheckboxInputProps) {
    return (
        <div className="property-row">
            <label>{label}</label>
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
        </div>
    );
}

// ============= Select Input =============

interface SelectInputProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}

function SelectInput({ label, value, options, onChange }: SelectInputProps) {
    return (
        <div className="property-row">
            <label>{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={inputStyle}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

// ============= Color Input =============

interface ColorInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
    return (
        <div className="property-row">
            <label>{label}</label>
            <input
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{ ...inputStyle, padding: '2px', height: '24px' }}
            />
        </div>
    );
}

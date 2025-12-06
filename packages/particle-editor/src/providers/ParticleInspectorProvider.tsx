/**
 * 粒子系统 Inspector Provider
 * Particle System Inspector Provider
 *
 * 检视器显示控制按钮，资产选择通过 @Property 装饰器自动渲染
 * Inspector shows control buttons, asset selection is auto-rendered via @Property decorator
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import type { IInspectorProvider, InspectorContext } from '@esengine/editor-core';
import type { ParticleSystemComponent } from '@esengine/particle';

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
    const [isLoading, setIsLoading] = useState(false);
    const [lastGuid, setLastGuid] = useState(component.particleAssetGuid);

    const refresh = useCallback(() => forceUpdate({}), []);

    // 当资产 GUID 变化时自动加载资产
    // Auto-load asset when GUID changes
    useEffect(() => {
        const currentGuid = component.particleAssetGuid;
        if (currentGuid !== lastGuid) {
            setLastGuid(currentGuid);
            if (currentGuid) {
                setIsLoading(true);
                component.loadAsset(currentGuid).finally(() => {
                    setIsLoading(false);
                    refresh();
                });
            } else {
                // 清除已加载的资产
                component.setAssetData(null);
                refresh();
            }
        }
    }, [component, component.particleAssetGuid, lastGuid, refresh]);

    const handlePlay = useCallback(async () => {
        // 如果有资产 GUID 但尚未加载，先加载
        if (component.particleAssetGuid && !component.loadedAsset) {
            setIsLoading(true);
            await component.loadAsset(component.particleAssetGuid);
            setIsLoading(false);
        }
        component.play();
        refresh();
    }, [component, refresh]);

    const handlePause = useCallback(() => {
        component.pause();
        refresh();
    }, [component, refresh]);

    const handleStop = useCallback(() => {
        component.stop(true);
        refresh();
    }, [component, refresh]);

    const handleBurst = useCallback(async () => {
        // 如果有资产 GUID 但尚未加载，先加载
        if (component.particleAssetGuid && !component.loadedAsset) {
            setIsLoading(true);
            await component.loadAsset(component.particleAssetGuid);
            setIsLoading(false);
        }
        component.emit(10);
        refresh();
    }, [component, refresh]);

    const hasAsset = !!component.particleAssetGuid;
    const isAssetLoaded = !!component.loadedAsset;

    return (
        <div className="entity-inspector">
            {/* 控制按钮 | Control buttons */}
            <div className="inspector-section">
                <div className="section-title">Controls</div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    <button
                        onClick={component.isPlaying ? handlePause : handlePlay}
                        style={buttonStyle}
                        title={component.isPlaying ? 'Pause' : 'Play'}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> :
                            component.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={handleStop} style={buttonStyle} title="Stop" disabled={isLoading}>
                        <RotateCcw size={14} />
                    </button>
                    <button onClick={handleBurst} style={buttonStyle} title="Burst 10" disabled={isLoading}>
                        <Sparkles size={14} />
                    </button>
                </div>
                <div className="property-row">
                    <label>Active Particles</label>
                    <span>{component.activeParticleCount} / {component.loadedAsset?.maxParticles ?? component.maxParticles}</span>
                </div>
                {hasAsset && (
                    <div className="property-row">
                        <label>Asset Status</label>
                        <span style={{ color: isAssetLoaded ? 'var(--color-success, #4caf50)' : 'var(--color-warning, #ff9800)' }}>
                            {isLoading ? 'Loading...' : isAssetLoaded ? 'Loaded' : 'Not loaded'}
                        </span>
                    </div>
                )}
            </div>

            {/* 提示信息 | Hint */}
            {!hasAsset && (
                <div style={{
                    padding: '8px 12px',
                    background: 'var(--color-warning-bg, rgba(255, 193, 7, 0.1))',
                    border: '1px solid var(--color-warning-border, rgba(255, 193, 7, 0.3))',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--text-color, #e0e0e0)',
                    lineHeight: 1.4
                }}>
                    No particle asset selected. Drag a <code>.particle</code> file to the Particle Asset field above, or create one in Content Browser.
                </div>
            )}
        </div>
    );
}

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

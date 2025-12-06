import React, { useState, useCallback, useEffect } from 'react';
import { IFieldEditor, FieldEditorProps, MessageHub } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';
import { Plus, Trash2, ChevronDown, ChevronRight, Film, Upload, Star, Play, Square } from 'lucide-react';
import type { AnimationClip, AnimationFrame, SpriteAnimatorComponent } from '@esengine/sprite';
import { AssetField } from '../../components/inspectors/fields/AssetField';
import { EngineService } from '../../services/EngineService';

interface DraggableNumberProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    label: string;
}

function DraggableNumber({ value, min = 0, max = 10, step = 0.1, onChange, disabled, label }: DraggableNumberProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartValue, setDragStartValue] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (disabled) return;
        setIsDragging(true);
        setDragStartX(e.clientX);
        setDragStartValue(value);
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - dragStartX;
            const sensitivity = e.shiftKey ? 0.1 : 1;
            let newValue = dragStartValue + delta * step * sensitivity;

            newValue = Math.max(min, Math.min(max, newValue));
            newValue = parseFloat(newValue.toFixed(2));

            onChange(newValue);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStartX, dragStartValue, step, min, max, onChange]);

    return (
        <label className="clip-draggable-number">
            <span
                className="clip-draggable-label"
                onMouseDown={handleMouseDown}
                style={{ cursor: disabled ? 'default' : 'ew-resize' }}
            >
                {label}
            </span>
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange(parseFloat(e.target.value) || 1)}
                disabled={disabled}
            />
        </label>
    );
}

export class AnimationClipsFieldEditor implements IFieldEditor<AnimationClip[]> {
    readonly type = 'animationClips';
    readonly name = 'Animation Clips Editor';
    readonly priority = 100;

    canHandle(fieldType: string): boolean {
        return fieldType === 'animationClips';
    }

    render({ label, value, onChange, context }: FieldEditorProps<AnimationClip[]>): React.ReactElement {
        return (
            <AnimationClipsEditor
                label={label}
                clips={value || []}
                onChange={onChange}
                readonly={context.readonly}
                component={context.metadata?.component as SpriteAnimatorComponent}
                onDefaultAnimationChange={context.metadata?.onDefaultAnimationChange}
            />
        );
    }
}

interface AnimationClipsEditorProps {
    label: string;
    clips: AnimationClip[];
    onChange: (clips: AnimationClip[]) => void;
    readonly?: boolean;
    component?: SpriteAnimatorComponent;
    onDefaultAnimationChange?: (value: string) => void;
}

function AnimationClipsEditor({ label, clips, onChange, readonly, component, onDefaultAnimationChange }: AnimationClipsEditorProps) {
    const [expandedClips, setExpandedClips] = useState<Set<number>>(new Set());
    const [playingClip, setPlayingClip] = useState<string | null>(null);

    const handleNavigate = useCallback((path: string) => {
        const messageHub = Core.services.tryResolve(MessageHub);
        if (messageHub) {
            messageHub.publish('asset:reveal', { path });
        }
    }, []);

    const toggleClip = (index: number) => {
        const newExpanded = new Set(expandedClips);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedClips(newExpanded);
    };

    const addClip = () => {
        const newName = `Animation ${clips.length + 1}`;
        const newClip: AnimationClip = {
            name: newName,
            frames: [],
            loop: true,
            speed: 1
        };
        onChange([...clips, newClip]);
        setExpandedClips(new Set([...expandedClips, clips.length]));

        // Auto-set first clip as default animation
        if (clips.length === 0 && component && !component.defaultAnimation) {
            component.defaultAnimation = newName;
            setDefaultAnimation(newName);
            if (onDefaultAnimationChange) {
                onDefaultAnimationChange(newName);
            }
        }
    };

    const removeClip = (index: number) => {
        const newClips = clips.filter((_, i) => i !== index);
        onChange(newClips);
    };

    const updateClip = (index: number, updates: Partial<AnimationClip>) => {
        const newClips = [...clips];
        const existingClip = newClips[index];
        if (!existingClip) return;
        newClips[index] = { ...existingClip, ...updates } as AnimationClip;
        onChange(newClips);
    };

    const addFrame = (clipIndex: number) => {
        const newClips = [...clips];
        const clip = newClips[clipIndex];
        if (!clip) return;
        clip.frames = [...clip.frames, { textureGuid: '', duration: 0.1 }];
        onChange(newClips);
    };

    const removeFrame = (clipIndex: number, frameIndex: number) => {
        const newClips = [...clips];
        const clip = newClips[clipIndex];
        if (!clip) return;
        clip.frames = clip.frames.filter((_, i) => i !== frameIndex);
        onChange(newClips);
    };

    const updateFrame = (clipIndex: number, frameIndex: number, updates: Partial<AnimationFrame>) => {
        const newClips = [...clips];
        const clip = newClips[clipIndex];
        if (!clip) return;
        clip.frames = [...clip.frames];
        const existingFrame = clip.frames[frameIndex];
        if (!existingFrame) return;
        clip.frames[frameIndex] = { ...existingFrame, ...updates } as AnimationFrame;
        onChange(newClips);
    };

    const addFramesBatch = (clipIndex: number, texturePaths: string[]) => {
        const newClips = [...clips];
        const clip = newClips[clipIndex];
        if (!clip) return;
        const newFrames = texturePaths.map((textureGuid) => ({
            textureGuid,
            duration: 0.1
        }));
        clip.frames = [...clip.frames, ...newFrames];
        onChange(newClips);
    };

    const handleFramesDrop = useCallback((clipIndex: number, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const data = e.dataTransfer.getData('application/json');
        if (data) {
            try {
                const items = JSON.parse(data);
                if (Array.isArray(items)) {
                    const textures = items
                        .filter((item: { type: string; path: string }) =>
                            item.type === 'file' && /\.(png|jpg|jpeg|webp|gif)$/i.test(item.path))
                        .map((item: { path: string }) => item.path)
                        .sort();
                    if (textures.length > 0) {
                        addFramesBatch(clipIndex, textures);
                    }
                }
            } catch {
                // Try text data for single file
                const text = e.dataTransfer.getData('text/plain');
                if (text && /\.(png|jpg|jpeg|webp|gif)$/i.test(text)) {
                    addFramesBatch(clipIndex, [text]);
                }
            }
        }
    }, [clips, onChange]);

    const handleFramesDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const [defaultAnimation, setDefaultAnimation] = useState(component?.defaultAnimation || '');

    // Sync with component changes
    useEffect(() => {
        if (component) {
            setDefaultAnimation(component.defaultAnimation || '');
        }
    }, [component?.defaultAnimation]);

    const setAsDefaultAnimationHandler = (clipName: string) => {
        if (component) {
            component.defaultAnimation = clipName;
            setDefaultAnimation(clipName);

            // Notify parent to update the defaultAnimation field
            if (onDefaultAnimationChange) {
                onDefaultAnimationChange(clipName);
            }
        }
    };

    const isDefaultAnimation = (clipName: string) => {
        return defaultAnimation === clipName;
    };

    const handlePlayPreview = (clipName: string) => {
        if (component) {
            const engineService = EngineService.getInstance();

            // Get the actual component from scene entity (not the one passed as prop)
            const scene = engineService.getScene();
            const entityId = component.entityId;
            let actualComponent = component;

            if (scene && entityId !== undefined && entityId !== null) {
                const sceneEntity = scene.findEntityById(entityId);
                if (sceneEntity) {
                    const sceneAnimator = sceneEntity.getComponent(component.constructor as any);
                    if (sceneAnimator) {
                        actualComponent = sceneAnimator as SpriteAnimatorComponent;
                    }
                }
            }

            if (playingClip === clipName) {
                // Stop playing
                actualComponent.stop();
                setPlayingClip(null);
                engineService.disableAnimationPreview();
            } else {
                // Stop previous animation if any
                actualComponent.stop();

                // Sync clips data to component before playing
                actualComponent.clips = clips;

                // Enable animation preview if not already enabled
                if (!engineService.isAnimationPreviewEnabled()) {
                    engineService.enableAnimationPreview();
                }

                // Play this clip
                actualComponent.play(clipName);
                setPlayingClip(clipName);
            }
        }
    };

    // Sync playingClip state with actual component state
    useEffect(() => {
        if (component && playingClip) {
            // Check if component is still playing
            if (!component.isPlaying()) {
                setPlayingClip(null);
            }
        }
    });

    // Stop preview when component unmounts
    useEffect(() => {
        return () => {
            if (component) {
                component.stop();
                const engineService = EngineService.getInstance();
                engineService.disableAnimationPreview();
            }
        };
    }, [component]);

    return (
        <div className="animation-clips-editor">
            <div className="clips-header">
                <span className="clips-label">{label}</span>
                {!readonly && (
                    <button className="add-clip-btn" onClick={addClip} title="Add Animation Clip">
                        <Plus size={12} />
                    </button>
                )}
            </div>

            {clips.length === 0 ? (
                <div className="clips-empty">
                    <Film size={24} strokeWidth={1} />
                    <span>No animation clips</span>
                </div>
            ) : (
                <div className="clips-list">
                    {clips.map((clip, clipIndex) => (
                        <div key={clipIndex} className="clip-item">
                            <div className="clip-header" onClick={() => toggleClip(clipIndex)}>
                                {expandedClips.has(clipIndex) ? (
                                    <ChevronDown size={14} />
                                ) : (
                                    <ChevronRight size={14} />
                                )}
                                <Film size={14} />
                                <input
                                    className="clip-name-input"
                                    value={clip.name}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        updateClip(clipIndex, { name: e.target.value });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={readonly}
                                />
                                <span className="frame-count">{clip.frames.length} frames</span>
                                {component && clip.frames.length > 0 && (
                                    <button
                                        className={`preview-clip-btn ${playingClip === clip.name ? 'is-playing' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlayPreview(clip.name);
                                        }}
                                        title={playingClip === clip.name ? 'Stop Preview' : 'Preview Animation'}
                                    >
                                        {playingClip === clip.name ? <Square size={10} /> : <Play size={10} />}
                                    </button>
                                )}
                                {component && !readonly && (
                                    <button
                                        className={`set-default-btn ${isDefaultAnimation(clip.name) ? 'is-default' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAsDefaultAnimationHandler(clip.name);
                                        }}
                                        title={isDefaultAnimation(clip.name) ? 'Current Default Animation' : 'Set as Default Animation'}
                                    >
                                        <Star size={12} fill={isDefaultAnimation(clip.name) ? 'currentColor' : 'none'} />
                                    </button>
                                )}
                                {!readonly && (
                                    <button
                                        className="remove-clip-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeClip(clipIndex);
                                        }}
                                        title="Remove Clip"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>

                            {expandedClips.has(clipIndex) && (
                                <div className="clip-content">
                                    <div className="clip-settings">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={clip.loop}
                                                onChange={(e) => updateClip(clipIndex, { loop: e.target.checked })}
                                                disabled={readonly}
                                            />
                                            Loop
                                        </label>
                                        <DraggableNumber
                                            label="Speed:"
                                            value={clip.speed}
                                            min={0}
                                            max={10}
                                            step={0.1}
                                            onChange={(val) => updateClip(clipIndex, { speed: val })}
                                            disabled={readonly}
                                        />
                                    </div>

                                    <div
                                        className="frames-section"
                                        onDrop={(e) => handleFramesDrop(clipIndex, e)}
                                        onDragOver={handleFramesDragOver}
                                    >
                                        <div className="frames-header">
                                            <span>Frames</span>
                                            {!readonly && (
                                                <button onClick={() => addFrame(clipIndex)} title="Add Frame">
                                                    <Plus size={10} />
                                                </button>
                                            )}
                                        </div>

                                        {clip.frames.length === 0 ? (
                                            <div className="frames-empty frames-drop-zone">
                                                <Upload size={16} />
                                                <span>Drop images here or click + to add</span>
                                            </div>
                                        ) : (
                                            <div className="frames-list">
                                                {clip.frames.map((frame, frameIndex) => (
                                                    <div key={frameIndex} className="frame-item">
                                                        <span className="frame-index">{frameIndex + 1}</span>
                                                        <div className="frame-texture-field">
                                                            <AssetField
                                                                value={frame.textureGuid}
                                                                onChange={(val) => updateFrame(clipIndex, frameIndex, { textureGuid: val || '' })}
                                                                fileExtension=".png"
                                                                placeholder="Texture..."
                                                                readonly={readonly}
                                                                onNavigate={handleNavigate}
                                                            />
                                                        </div>
                                                        <input
                                                            className="frame-duration"
                                                            type="number"
                                                            min={0.01}
                                                            step={0.01}
                                                            value={frame.duration}
                                                            onChange={(e) => updateFrame(clipIndex, frameIndex, { duration: parseFloat(e.target.value) || 0.1 })}
                                                            disabled={readonly}
                                                            title="Duration (seconds)"
                                                        />
                                                        {!readonly && (
                                                            <button
                                                                onClick={() => removeFrame(clipIndex, frameIndex)}
                                                                title="Remove Frame"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

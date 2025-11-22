import React, { useState, useCallback } from 'react';
import { IFieldEditor, FieldEditorProps, MessageHub } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';
import { Plus, Trash2, ChevronDown, ChevronRight, Film, Upload } from 'lucide-react';
import type { AnimationClip, AnimationFrame } from '@esengine/ecs-components';
import { AssetField } from '../../components/inspectors/fields/AssetField';

interface ClipEditorState {
    expandedClips: Set<string>;
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
            />
        );
    }
}

interface AnimationClipsEditorProps {
    label: string;
    clips: AnimationClip[];
    onChange: (clips: AnimationClip[]) => void;
    readonly?: boolean;
}

function AnimationClipsEditor({ label, clips, onChange, readonly }: AnimationClipsEditorProps) {
    const [expandedClips, setExpandedClips] = useState<Set<number>>(new Set());

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
        clip.frames = [...clip.frames, { texture: '', duration: 0.1 }];
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
        const newFrames = texturePaths.map(texture => ({
            texture,
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
                                        <label>
                                            Speed:
                                            <input
                                                type="number"
                                                value={clip.speed}
                                                min={0}
                                                max={10}
                                                step={0.1}
                                                onChange={(e) => updateClip(clipIndex, { speed: parseFloat(e.target.value) || 1 })}
                                                disabled={readonly}
                                            />
                                        </label>
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
                                                                value={frame.texture}
                                                                onChange={(val) => updateFrame(clipIndex, frameIndex, { texture: val || '' })}
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

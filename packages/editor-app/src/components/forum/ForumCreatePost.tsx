/**
 * 论坛创建帖子组件 - GitHub Discussions
 * Forum create post component - GitHub Discussions
 */
import { useState, useRef, useCallback } from 'react';
import {
    ArrowLeft, Send, AlertCircle, Eye, Edit3,
    Bold, Italic, Code, Link, List, Image, Quote, HelpCircle,
    Upload, Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocale } from '../../hooks/useLocale';
import { getForumService } from '../../services/forum';
import type { Category } from '../../services/forum';
import { parseEmoji } from './utils';
import './ForumCreatePost.css';

interface ForumCreatePostProps {
    categories: Category[];
    onBack: () => void;
    onCreated: () => void;
}

type EditorTab = 'write' | 'preview';

export function ForumCreatePost({ categories, onBack, onCreated }: ForumCreatePostProps) {
    const { t } = useLocale();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<EditorTab>('write');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const forumService = getForumService();

    /**
     * 处理图片上传
     * Handle image upload
     */
    const handleImageUpload = useCallback(async (file: File) => {
        if (uploading) return;

        setUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const imageUrl = await forumService.uploadImage(file, (progress) => {
                setUploadProgress(progress);
            });

            // 插入 Markdown 图片语法 | Insert Markdown image syntax
            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const imageMarkdown = `![${file.name}](${imageUrl})`;
                const newBody = body.substring(0, start) + imageMarkdown + body.substring(end);
                setBody(newBody);

                // 恢复光标位置 | Restore cursor position
                setTimeout(() => {
                    textarea.focus();
                    const newPos = start + imageMarkdown.length;
                    textarea.setSelectionRange(newPos, newPos);
                }, 0);
            } else {
                // 如果没有 textarea，直接追加到末尾 | Append to end if no textarea
                setBody(prev => prev + `\n![${file.name}](${imageUrl})`);
            }
        } catch (err) {
            console.error('[ForumCreatePost] Upload failed:', err);
            setError(err instanceof Error ? err.message : t('forum.failedToUploadImage'));
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, [body, forumService, t, uploading]);

    /**
     * 处理拖拽事件
     * Handle drag events
     */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(f => f.type.startsWith('image/'));
        if (imageFile) {
            handleImageUpload(imageFile);
        }
    }, [handleImageUpload]);

    /**
     * 处理粘贴事件
     * Handle paste event
     */
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        const items = Array.from(e.clipboardData.items);
        const imageItem = items.find(item => item.type.startsWith('image/'));

        if (imageItem) {
            e.preventDefault();
            const file = imageItem.getAsFile();
            if (file) {
                handleImageUpload(file);
            }
        }
    }, [handleImageUpload]);

    /**
     * 处理文件选择
     * Handle file selection
     */
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
        // 清空 input 以便重复选择同一文件 | Clear input to allow selecting same file again
        e.target.value = '';
    }, [handleImageUpload]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 验证 | Validation
        if (!title.trim()) {
            setError(t('forum.enterTitle'));
            return;
        }
        if (!body.trim()) {
            setError(t('forum.enterContent'));
            return;
        }
        if (!categoryId) {
            setError(t('forum.selectCategoryError'));
            return;
        }

        setSubmitting(true);
        try {
            const post = await forumService.createPost({
                title: title.trim(),
                body: body.trim(),
                categoryId
            });

            if (post) {
                onCreated();
            } else {
                setError(t('forum.failedToCreateDiscussion'));
            }
        } catch (err) {
            console.error('[ForumCreatePost] Error:', err);
            setError(err instanceof Error ? err.message : t('forum.anErrorOccurred'));
        } finally {
            setSubmitting(false);
        }
    };

    // 插入 Markdown 语法 | Insert Markdown syntax
    const insertMarkdown = (prefix: string, suffix: string = '', placeholder: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = body.substring(start, end) || placeholder;

        const newBody = body.substring(0, start) + prefix + selectedText + suffix + body.substring(end);
        setBody(newBody);

        // 恢复光标位置 | Restore cursor position
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + prefix.length + selectedText.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const toolbarButtons = [
        { icon: <Bold size={14} />, action: () => insertMarkdown('**', '**', 'bold'), title: t('forum.bold') },
        { icon: <Italic size={14} />, action: () => insertMarkdown('*', '*', 'italic'), title: t('forum.italic') },
        { icon: <Code size={14} />, action: () => insertMarkdown('`', '`', 'code'), title: t('forum.inlineCode') },
        { icon: <Link size={14} />, action: () => insertMarkdown('[', '](url)', 'link text'), title: t('forum.link') },
        { icon: <List size={14} />, action: () => insertMarkdown('\n- ', '', 'list item'), title: t('forum.list') },
        { icon: <Quote size={14} />, action: () => insertMarkdown('\n> ', '', 'quote'), title: t('forum.quote') },
        { icon: <Upload size={14} />, action: () => fileInputRef.current?.click(), title: t('forum.uploadImage') },
    ];

    const selectedCategory = categories.find(c => c.id === categoryId);

    return (
        <div className="forum-create-post">
            {/* 返回按钮 | Back button */}
            <button className="forum-back-btn" onClick={onBack}>
                <ArrowLeft size={18} />
                <span>{t('forum.backToList')}</span>
            </button>

            <div className="forum-create-container">
                {/* 左侧：编辑区 | Left: Editor */}
                <div className="forum-create-main">
                    <div className="forum-create-header">
                        <h2>{t('forum.startDiscussion')}</h2>
                        {selectedCategory && (
                            <span className="forum-create-selected-category">
                                {parseEmoji(selectedCategory.emoji)} {selectedCategory.name}
                            </span>
                        )}
                    </div>

                    <form className="forum-create-form" onSubmit={handleSubmit}>
                        {/* 分类选择 | Category selection */}
                        <div className="forum-create-field">
                            <label>{t('forum.selectCategory')}</label>
                            <div className="forum-create-categories">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`forum-create-category ${categoryId === cat.id ? 'selected' : ''}`}
                                        onClick={() => setCategoryId(cat.id)}
                                    >
                                        <span className="forum-create-category-emoji">{parseEmoji(cat.emoji)}</span>
                                        <span className="forum-create-category-name">{cat.name}</span>
                                        {cat.description && (
                                            <span className="forum-create-category-desc">{cat.description}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 标题 | Title */}
                        <div className="forum-create-field">
                            <label>{t('forum.title')}</label>
                            <div className="forum-create-title-input">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t('forum.enterDescriptiveTitle')}
                                    maxLength={200}
                                />
                                <span className="forum-create-count">{title.length}/200</span>
                            </div>
                        </div>

                        {/* 编辑器 | Editor */}
                        <div className="forum-create-field forum-create-editor-field">
                            <div className="forum-editor-header">
                                <div className="forum-editor-tabs">
                                    <button
                                        type="button"
                                        className={`forum-editor-tab ${activeTab === 'write' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('write')}
                                    >
                                        <Edit3 size={14} />
                                        <span>{t('forum.write')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`forum-editor-tab ${activeTab === 'preview' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('preview')}
                                    >
                                        <Eye size={14} />
                                        <span>{t('forum.preview')}</span>
                                    </button>
                                </div>

                                {activeTab === 'write' && (
                                    <div className="forum-editor-toolbar">
                                        {toolbarButtons.map((btn, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="forum-editor-tool"
                                                onClick={btn.action}
                                                title={btn.title}
                                            >
                                                {btn.icon}
                                            </button>
                                        ))}
                                        <a
                                            href="https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="forum-editor-help"
                                            title={t('forum.markdownHelp')}
                                        >
                                            <HelpCircle size={14} />
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div
                                className={`forum-editor-content ${isDragging ? 'dragging' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {/* 隐藏的文件输入 | Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/gif,image/webp"
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                />

                                {/* 上传进度提示 | Upload progress indicator */}
                                {uploading && (
                                    <div className="forum-editor-upload-overlay">
                                        <Loader2 size={24} className="spin" />
                                        <span>{t('forum.uploading')} {uploadProgress}%</span>
                                    </div>
                                )}

                                {/* 拖拽提示 | Drag hint */}
                                {isDragging && !uploading && (
                                    <div className="forum-editor-drag-overlay">
                                        <Upload size={32} />
                                        <span>{t('forum.dropImageHere')}</span>
                                    </div>
                                )}

                                {activeTab === 'write' ? (
                                    <textarea
                                        ref={textareaRef}
                                        className="forum-editor-textarea"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        onPaste={handlePaste}
                                        placeholder={t('forum.editorPlaceholder')}
                                    />
                                ) : (
                                    <div className="forum-editor-preview">
                                        {body ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {body}
                                            </ReactMarkdown>
                                        ) : (
                                            <p className="forum-editor-preview-empty">
                                                {t('forum.nothingToPreview')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 错误提示 | Error message */}
                        {error && (
                            <div className="forum-create-error">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* 提交按钮 | Submit button */}
                        <div className="forum-create-actions">
                            <button
                                type="button"
                                className="forum-btn"
                                onClick={onBack}
                                disabled={submitting}
                            >
                                {t('forum.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="forum-btn forum-btn-primary forum-btn-submit"
                                disabled={submitting || !title.trim() || !body.trim() || !categoryId}
                            >
                                <Send size={16} />
                                <span>
                                    {submitting ? t('forum.creating') : t('forum.createDiscussion')}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* 右侧：提示 | Right: Tips */}
                <div className="forum-create-sidebar">
                    <div className="forum-create-tips">
                        <h3>{t('forum.tips')}</h3>
                        <ul>
                            <li>{t('forum.tip1')}</li>
                            <li>{t('forum.tip2')}</li>
                            <li>{t('forum.tip3')}</li>
                            <li>{t('forum.tip4')}</li>
                            <li>{t('forum.tip5')}</li>
                        </ul>
                    </div>

                    <div className="forum-create-markdown-guide">
                        <h3>{t('forum.markdownGuide')}</h3>
                        <div className="forum-create-markdown-examples">
                            <div className="markdown-example">
                                <code>**bold**</code>
                                <span>→</span>
                                <strong>bold</strong>
                            </div>
                            <div className="markdown-example">
                                <code>*italic*</code>
                                <span>→</span>
                                <em>italic</em>
                            </div>
                            <div className="markdown-example">
                                <code>`code`</code>
                                <span>→</span>
                                <code className="inline">code</code>
                            </div>
                            <div className="markdown-example">
                                <code>[link](url)</code>
                                <span>→</span>
                                <a href="#">link</a>
                            </div>
                            <div className="markdown-example">
                                <code>- item</code>
                                <span>→</span>
                                <span>• item</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

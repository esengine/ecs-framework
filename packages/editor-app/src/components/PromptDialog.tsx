import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import '../styles/PromptDialog.css';

interface PromptDialogProps {
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText: string;
  cancelText: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
    title,
    message,
    defaultValue = '',
    placeholder,
    confirmText,
    cancelText,
    onConfirm,
    onCancel
}: PromptDialogProps) {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleConfirm = () => {
        if (value.trim()) {
            onConfirm(value.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirm();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    return (
        <div className="prompt-dialog-overlay" onClick={onCancel}>
            <div className="prompt-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="prompt-dialog-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onCancel}>
                        <X size={16} />
                    </button>
                </div>
                <div className="prompt-dialog-content">
                    <p>{message}</p>
                    <input
                        ref={inputRef}
                        type="text"
                        className="prompt-dialog-input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                    />
                </div>
                <div className="prompt-dialog-footer">
                    <button className="prompt-dialog-btn cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className="prompt-dialog-btn confirm"
                        onClick={handleConfirm}
                        disabled={!value.trim()}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

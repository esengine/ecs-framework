import React, { useEffect, useRef, useCallback } from 'react';

export interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    onConfirm,
    onCancel
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen && confirmBtnRef.current) {
            confirmBtnRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            } else if (e.key === 'Enter') {
                onConfirm();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onConfirm, onCancel]);

    const handleConfirm = useCallback(() => {
        onConfirm();
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    if (!isOpen) return null;

    return (
        <div className="ne-dialog-overlay">
            <div ref={dialogRef} className={`ne-dialog ne-dialog-${type}`}>
                <div className="ne-dialog-header">
                    <span className="ne-dialog-title">{title}</span>
                </div>
                <div className="ne-dialog-body">
                    <p className="ne-dialog-message">{message}</p>
                </div>
                <div className="ne-dialog-footer">
                    <button
                        className="ne-dialog-btn ne-dialog-btn-cancel"
                        onClick={handleCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        className={`ne-dialog-btn ne-dialog-btn-confirm ne-dialog-btn-${type}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

import { X } from 'lucide-react';
import '../styles/ConfirmDialog.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmText, cancelText, onConfirm, onCancel }: ConfirmDialogProps) {
    return (
        <div className="confirm-dialog-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-dialog-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onCancel}>
                        <X size={16} />
                    </button>
                </div>
                <div className="confirm-dialog-content">
                    <p>{message}</p>
                </div>
                <div className="confirm-dialog-footer">
                    <button className="confirm-dialog-btn cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className="confirm-dialog-btn confirm" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

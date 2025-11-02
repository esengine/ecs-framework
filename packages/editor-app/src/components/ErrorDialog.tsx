import { X } from 'lucide-react';
import '../styles/ErrorDialog.css';

interface ErrorDialogProps {
  title: string;
  message: string;
  onClose: () => void;
}

export function ErrorDialog({ title, message, onClose }: ErrorDialogProps) {
    return (
        <div className="error-dialog-overlay" onClick={onClose}>
            <div className="error-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="error-dialog-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
                <div className="error-dialog-content">
                    <p>{message}</p>
                </div>
                <div className="error-dialog-footer">
                    <button className="error-dialog-btn" onClick={onClose}>
            确定
                    </button>
                </div>
            </div>
        </div>
    );
}

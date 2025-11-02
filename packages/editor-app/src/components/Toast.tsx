import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import '../styles/Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const toast: Toast = { id, message, type, duration };

        setToasts((prev) => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                hideToast(id);
            }, duration);
        }
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <XCircle size={20} />;
            case 'warning':
                return <AlertCircle size={20} />;
            case 'info':
                return <Info size={20} />;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <div className="toast-icon">
                            {getIcon(toast.type)}
                        </div>
                        <div className="toast-message">{toast.message}</div>
                        <button
                            className="toast-close"
                            onClick={() => hideToast(toast.id)}
                            aria-label="关闭"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

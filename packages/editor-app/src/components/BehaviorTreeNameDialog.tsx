import { useState, useEffect } from 'react';
import '../styles/BehaviorTreeNameDialog.css';

interface BehaviorTreeNameDialogProps {
    isOpen: boolean;
    onConfirm: (name: string) => void;
    onCancel: () => void;
    defaultName?: string;
}

export const BehaviorTreeNameDialog: React.FC<BehaviorTreeNameDialogProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    defaultName = ''
}) => {
    const [name, setName] = useState(defaultName);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(defaultName);
            setError('');
        }
    }, [isOpen, defaultName]);

    if (!isOpen) return null;

    const validateName = (value: string): boolean => {
        if (!value.trim()) {
            setError('行为树名称不能为空');
            return false;
        }

        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(value)) {
            setError('名称包含非法字符（不能包含 < > : " / \\ | ? *）');
            return false;
        }

        setError('');
        return true;
    };

    const handleConfirm = () => {
        if (validateName(name)) {
            onConfirm(name.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleNameChange = (value: string) => {
        setName(value);
        if (error) {
            validateName(value);
        }
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-content">
                <div className="dialog-header">
                    <h3>保存行为树</h3>
                </div>
                <div className="dialog-body">
                    <label htmlFor="btree-name">行为树名称:</label>
                    <input
                        id="btree-name"
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="请输入行为树名称"
                        autoFocus
                    />
                    {error && <div className="dialog-error">{error}</div>}
                    <div className="dialog-hint">
                        将保存到项目目录: .ecs/behaviors/{name || '名称'}.btree
                    </div>
                </div>
                <div className="dialog-footer">
                    <button onClick={onCancel} className="dialog-button dialog-button-secondary">
                        取消
                    </button>
                    <button onClick={handleConfirm} className="dialog-button dialog-button-primary">
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

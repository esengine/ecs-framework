import React, { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { TauriAPI } from '../api/tauri';
import '../styles/QRCodeDialog.css';

interface QRCodeDialogProps {
    url: string;
    isOpen: boolean;
    onClose: () => void;
}

export const QRCodeDialog: React.FC<QRCodeDialogProps> = ({ url, isOpen, onClose }) => {
    const [qrCodeData, setQrCodeData] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && url) {
            setLoading(true);
            TauriAPI.generateQRCode(url)
                .then((base64) => {
                    setQrCodeData(`data:image/png;base64,${base64}`);
                })
                .catch((error) => {
                    console.error('Failed to generate QR code:', error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, url]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy URL:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="qrcode-dialog-overlay">
            <div className="qrcode-dialog">
                <div className="qrcode-dialog-header">
                    <h3>扫码在移动设备上预览</h3>
                    <button className="qrcode-dialog-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="qrcode-dialog-content">
                    {loading ? (
                        <div className="qrcode-loading">生成二维码中...</div>
                    ) : qrCodeData ? (
                        <img src={qrCodeData} alt="QR Code" width={200} height={200} />
                    ) : (
                        <div className="qrcode-error">生成失败</div>
                    )}

                    <div className="qrcode-url-container">
                        <input
                            type="text"
                            value={url}
                            readOnly
                            className="qrcode-url-input"
                        />
                        <button
                            className="qrcode-copy-button"
                            onClick={handleCopy}
                            title={copied ? '已复制' : '复制链接'}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>

                    <p className="qrcode-hint">
                        确保手机和电脑在同一局域网内
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRCodeDialog;

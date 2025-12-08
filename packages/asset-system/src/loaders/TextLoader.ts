/**
 * Text asset loader
 * 文本资产加载器
 */

import { AssetType } from '../types/AssetTypes';
import { IAssetLoader, ITextAsset, IAssetParseContext } from '../interfaces/IAssetLoader';
import { IAssetContent, AssetContentType } from '../interfaces/IAssetReader';

/**
 * Text loader implementation
 * 文本加载器实现
 */
export class TextLoader implements IAssetLoader<ITextAsset> {
    readonly supportedType = AssetType.Text;
    readonly supportedExtensions = ['.txt', '.text', '.md', '.csv', '.xml', '.html', '.css', '.js', '.ts'];
    readonly contentType: AssetContentType = 'text';

    /**
     * Parse text from content.
     * 从内容解析文本。
     */
    async parse(content: IAssetContent, _context: IAssetParseContext): Promise<ITextAsset> {
        if (!content.text) {
            throw new Error('Text content is empty');
        }

        return {
            content: content.text,
            encoding: this.detectEncoding(content.text)
        };
    }

    /**
     * Detect text encoding
     * 检测文本编码
     */
    private detectEncoding(content: string): 'utf8' | 'utf16' | 'ascii' {
        for (let i = 0; i < content.length; i++) {
            const charCode = content.charCodeAt(i);
            if (charCode > 127) {
                return charCode > 255 ? 'utf16' : 'utf8';
            }
        }
        return 'ascii';
    }

    /**
     * Dispose loaded asset
     * 释放已加载的资产
     */
    dispose(asset: ITextAsset): void {
        // 清空文本内容 | Clear text content
        asset.content = '';
    }
}

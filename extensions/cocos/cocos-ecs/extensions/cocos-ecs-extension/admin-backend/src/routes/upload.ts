import { Router, Request, Response } from 'express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';
import * as AdmZip from 'adm-zip';
import { execute, query } from '../database';

interface MulterRequest extends Request {
    file?: any;
}

export const uploadRoutes = Router();

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/packages');
        await fs.ensureDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB限制
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/zip' || path.extname(file.originalname).toLowerCase() === '.zip') {
            cb(null, true);
        } else {
            cb(new Error('只允许上传ZIP文件'));
        }
    }
});

/**
 * 上传插件包
 */
uploadRoutes.post('/package', upload.single('package'), async (req: MulterRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '未选择文件'
            });
        }

        const { pluginId, version, channel, description, mandatory } = req.body;
        
        if (!pluginId || !version || !channel) {
            // 删除已上传的文件
            await fs.remove(req.file.path);
            return res.status(400).json({
                success: false,
                error: '缺少必要参数: pluginId, version, channel'
            });
        }

        console.log(`📦 上传插件包: ${pluginId} v${version} (${channel})`);

        // 计算文件哈希
        const fileHash = await calculateFileHash(req.file.path);
        
        // 分析ZIP文件内容
        const zipAnalysis = await analyzeZipFile(req.file.path);
        
        // 生成下载URL
        const downloadUrl = `/uploads/packages/${req.file.filename}`;
        
        // 创建版本记录
        const result = await execute(`
            INSERT INTO versions 
            (plugin_id, version, channel, description, download_url, file_size, checksum, mandatory, release_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            pluginId, 
            version, 
            channel, 
            description || '', 
            downloadUrl, 
            req.file.size, 
            fileHash, 
            mandatory === 'true' ? 1 : 0, 
            new Date().toISOString()
        ]);

        const versionId = result.lastID;

        // 添加文件记录
        for (const file of zipAnalysis.files) {
            await execute(`
                INSERT INTO version_files (version_id, file_path, file_hash, file_size, action)
                VALUES (?, ?, ?, ?, ?)
            `, [versionId, file.path, file.hash, file.size, 'update']);
        }

        res.json({
            success: true,
            data: {
                id: versionId,
                pluginId,
                version,
                channel,
                description: description || '',
                downloadUrl,
                fileSize: req.file.size,
                checksum: fileHash,
                mandatory: mandatory === 'true',
                filesCount: zipAnalysis.files.length,
                uploadedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        // 清理文件
        if (req.file) {
            await fs.remove(req.file.path).catch(() => {});
        }
        
        console.error('上传失败:', error);
        res.status(500).json({
            success: false,
            error: '上传失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 上传进度查询
 */
uploadRoutes.get('/progress/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // 这里可以实现真正的进度追踪
        // 目前返回完成状态
        res.json({
            success: true,
            data: {
                id,
                progress: 100,
                status: 'completed'
            }
        });
        
    } catch (error) {
        console.error('查询上传进度失败:', error);
        res.status(500).json({
            success: false,
            error: '查询上传进度失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 获取上传历史
 */
uploadRoutes.get('/history', async (req: Request, res: Response) => {
    try {
        const { pluginId, limit = 10 } = req.query;
        
        let sql = `
            SELECT v.*, p.display_name as plugin_display_name, p.icon as plugin_icon
            FROM versions v
            LEFT JOIN plugins p ON v.plugin_id = p.id
            WHERE 1=1
        `;
        const params: any[] = [];
        
        if (pluginId) {
            sql += ' AND v.plugin_id = ?';
            params.push(pluginId);
        }
        
        sql += ` ORDER BY v.created_at DESC LIMIT ?`;
        params.push(Number(limit));
        
        const uploads = await query(sql, params);
        
        res.json({
            success: true,
            data: uploads.map(u => ({
                id: u.id,
                pluginId: u.plugin_id,
                version: u.version,
                channel: u.channel,
                fileSize: u.file_size,
                uploadedAt: u.created_at,
                pluginDisplayName: u.plugin_display_name,
                pluginIcon: u.plugin_icon
            }))
        });
        
    } catch (error) {
        console.error('获取上传历史失败:', error);
        res.status(500).json({
            success: false,
            error: '获取上传历史失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 计算文件哈希值
 */
async function calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

/**
 * 分析ZIP文件内容
 */
async function analyzeZipFile(filePath: string): Promise<{ files: Array<{ path: string; hash: string; size: number }> }> {
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    
    const files: Array<{ path: string; hash: string; size: number }> = [];
    
    for (const entry of entries) {
        if (!entry.isDirectory) {
            const content = entry.getData();
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            
            files.push({
                path: entry.entryName,
                hash: hash,
                size: entry.header.size
            });
        }
    }
    
    return { files };
} 
import { Router, Request, Response } from 'express';
import { query, queryOne, execute } from '../database';

export const versionRoutes = Router();

/**
 * 获取所有版本列表
 */
versionRoutes.get('/', async (req: Request, res: Response) => {
    try {
        const { pluginId, channel, limit = 50 } = req.query;
        
        let sql = `
            SELECT v.*, p.display_name as plugin_display_name, p.icon as plugin_icon
            FROM versions v
            LEFT JOIN plugins p ON v.plugin_id = p.id
            WHERE v.status = 'active'
        `;
        const params: any[] = [];
        
        if (pluginId) {
            sql += ' AND v.plugin_id = ?';
            params.push(pluginId);
        }
        
        if (channel) {
            sql += ' AND v.channel = ?';
            params.push(channel);
        }
        
        sql += ` ORDER BY v.created_at DESC LIMIT ?`;
        params.push(Number(limit));
        
        const versions = await query(sql, params);
        
        res.json({
            success: true,
            data: versions
        });
        
    } catch (error) {
        console.error('获取版本列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取版本列表失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 获取特定版本详情
 */
versionRoutes.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const version = await query(`
            SELECT v.*, p.display_name as plugin_display_name, p.icon as plugin_icon
            FROM versions v
            LEFT JOIN plugins p ON v.plugin_id = p.id
            WHERE v.id = ? AND v.status = 'active'
        `, [id]);
        
        if (version.length === 0) {
            return res.status(404).json({
                success: false,
                error: '版本不存在'
            });
        }
        
        // 获取版本文件列表
        const files = await query(`
            SELECT * FROM version_files WHERE version_id = ?
        `, [id]);
        
        res.json({
            success: true,
            data: {
                ...version[0],
                files
            }
        });
        
    } catch (error) {
        console.error('获取版本详情失败:', error);
        res.status(500).json({
            success: false,
            error: '获取版本详情失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 删除版本
 */
versionRoutes.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // 软删除
        await execute(`
            UPDATE versions SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [id]);
        
        res.json({
            success: true,
            message: '版本删除成功'
        });
        
    } catch (error) {
        console.error('删除版本失败:', error);
        res.status(500).json({
            success: false,
            error: '删除版本失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 更新版本状态
 */
versionRoutes.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['active', 'inactive', 'deleted'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '无效的状态值'
            });
        }
        
        await execute(`
            UPDATE versions SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [status, id]);
        
        res.json({
            success: true,
            message: '状态更新成功'
        });
        
    } catch (error) {
        console.error('更新版本状态失败:', error);
        res.status(500).json({
            success: false,
            error: '更新版本状态失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 检查更新 (供客户端使用)
 */
versionRoutes.post('/check', async (req: Request, res: Response) => {
    try {
        const { currentVersion, pluginId = 'cocos-ecs-extension', channel = 'stable', platform, editorVersion } = req.body;
        
        console.log(`📱 插件更新检查: ${pluginId} v${currentVersion} (${channel}) - ${platform}`);
        
        // 查找最新版本
        const latestVersion = await queryOne(`
            SELECT * FROM versions 
            WHERE plugin_id = ? AND channel = ? AND status = 'active'
            ORDER BY created_at DESC
            LIMIT 1
        `, [pluginId, channel]);
        
        if (!latestVersion) {
            return res.json({
                hasUpdate: false,
                message: `暂无 ${pluginId} 的 ${channel} 版本`,
                currentVersion
            });
        }
        
        // 比较版本号
        const hasUpdate = isNewerVersion(latestVersion.version, currentVersion);
        
        if (hasUpdate) {
            // 记录更新检查
            await execute(`
                INSERT OR REPLACE INTO update_stats (plugin_id, version, user_count, last_updated)
                VALUES (?, ?, COALESCE((SELECT user_count FROM update_stats WHERE plugin_id = ? AND version = ?), 0) + 1, ?)
            `, [pluginId, latestVersion.version, pluginId, latestVersion.version, new Date().toISOString()]);
            
            // 获取文件列表
            const files = await query(`
                SELECT file_path, file_hash, file_size, action
                FROM version_files
                WHERE version_id = ?
            `, [latestVersion.id]);
            
            res.json({
                hasUpdate: true,
                version: latestVersion.version,
                releaseDate: latestVersion.release_date,
                description: latestVersion.description,
                downloadUrl: latestVersion.download_url,
                fileSize: latestVersion.file_size,
                checksum: latestVersion.checksum,
                mandatory: latestVersion.mandatory === 1,
                files: files.map(f => ({
                    path: f.file_path,
                    hash: f.file_hash,
                    size: f.file_size,
                    action: f.action
                }))
            });
        } else {
            res.json({
                hasUpdate: false,
                message: `${pluginId} 当前已是最新版本`,
                currentVersion
            });
        }
        
    } catch (error) {
        console.error('检查更新失败:', error);
        res.status(500).json({
            hasUpdate: false,
            error: '检查更新失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 创建新版本
 */
versionRoutes.post('/', async (req: Request, res: Response) => {
    try {
        const { pluginId, version, channel, description, downloadUrl, fileSize, checksum, mandatory, files } = req.body;
        
        // 检查版本是否已存在
        const existingVersion = await queryOne(`
            SELECT id FROM versions
            WHERE plugin_id = ? AND version = ? AND channel = ?
        `, [pluginId, version, channel]);
        
        if (existingVersion) {
            return res.status(400).json({
                success: false,
                error: '该版本已存在'
            });
        }
        
        // 创建版本记录
        const result = await execute(`
            INSERT INTO versions 
            (plugin_id, version, channel, description, download_url, file_size, checksum, mandatory, release_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [pluginId, version, channel, description, downloadUrl, fileSize, checksum, mandatory ? 1 : 0, new Date().toISOString()]);
        
        const versionId = result.lastID;
        
        // 添加文件记录
        if (files && files.length > 0) {
            for (const file of files) {
                await execute(`
                    INSERT INTO version_files (version_id, file_path, file_hash, file_size, action)
                    VALUES (?, ?, ?, ?, ?)
                `, [versionId, file.path, file.hash, file.size, file.action || 'update']);
            }
        }
        
        res.json({
            success: true,
            data: {
                id: versionId,
                pluginId,
                version,
                channel,
                description,
                downloadUrl,
                fileSize,
                checksum,
                mandatory
            }
        });
        
    } catch (error) {
        console.error('创建版本失败:', error);
        res.status(500).json({
            success: false,
            error: '创建版本失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 更新版本信息
 */
versionRoutes.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { description, status, mandatory } = req.body;
        
        await execute(`
            UPDATE versions 
            SET description = ?, status = ?, mandatory = ?, updated_at = ?
            WHERE id = ?
        `, [description, status, mandatory ? 1 : 0, new Date().toISOString(), id]);
        
        res.json({
            success: true,
            message: '版本信息更新成功'
        });
        
    } catch (error) {
        console.error('更新版本失败:', error);
        res.status(500).json({
            success: false,
            error: '更新版本失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 比较版本号
 */
function isNewerVersion(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string) => {
        return version.split('.').map(Number);
    };

    const newParts = parseVersion(newVersion);
    const currentParts = parseVersion(currentVersion);
    const maxLength = Math.max(newParts.length, currentParts.length);

    for (let i = 0; i < maxLength; i++) {
        const newPart = newParts[i] || 0;
        const currentPart = currentParts[i] || 0;

        if (newPart > currentPart) return true;
        if (newPart < currentPart) return false;
    }

    return false;
} 
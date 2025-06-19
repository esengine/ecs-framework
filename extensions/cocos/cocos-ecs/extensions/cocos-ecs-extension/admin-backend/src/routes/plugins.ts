import { Router, Request, Response } from 'express';
import { query, queryOne, execute } from '../database';

export const pluginRoutes = Router();

/**
 * 获取插件列表
 */
pluginRoutes.get('/', async (req: Request, res: Response) => {
    try {
        const plugins = await query(`
            SELECT 
                p.*,
                COUNT(DISTINCT v.id) as version_count,
                COALESCE(SUM(us.user_count), 0) as total_downloads,
                MAX(v.created_at) as latest_version_date
            FROM plugins p
            LEFT JOIN versions v ON p.id = v.plugin_id
            LEFT JOIN update_stats us ON p.id = us.plugin_id
            GROUP BY p.id
            ORDER BY p.display_name
        `);
        
        res.json({
            success: true,
            data: plugins.map(p => ({
                id: p.id,
                name: p.name,
                displayName: p.display_name,
                description: p.description,
                author: p.author,
                repository: p.repository,
                icon: p.icon,
                status: p.status,
                versionCount: p.version_count,
                totalDownloads: p.total_downloads,
                latestVersionDate: p.latest_version_date,
                createdAt: p.created_at
            }))
        });
        
    } catch (error) {
        console.error('获取插件列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取插件列表失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 获取特定插件信息
 */
pluginRoutes.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const plugin = await queryOne(`
            SELECT 
                p.*,
                COUNT(DISTINCT v.id) as version_count,
                COALESCE(SUM(us.user_count), 0) as total_downloads,
                MAX(v.created_at) as latest_version_date
            FROM plugins p
            LEFT JOIN versions v ON p.id = v.plugin_id
            LEFT JOIN update_stats us ON p.id = us.plugin_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [id]);
        
        if (!plugin) {
            return res.status(404).json({
                success: false,
                error: '插件不存在'
            });
        }
        
        res.json({
            success: true,
            data: {
                id: plugin.id,
                name: plugin.name,
                displayName: plugin.display_name,
                description: plugin.description,
                author: plugin.author,
                repository: plugin.repository,
                icon: plugin.icon,
                status: plugin.status,
                versionCount: plugin.version_count,
                totalDownloads: plugin.total_downloads,
                latestVersionDate: plugin.latest_version_date,
                createdAt: plugin.created_at
            }
        });
        
    } catch (error) {
        console.error('获取插件信息失败:', error);
        res.status(500).json({
            success: false,
            error: '获取插件信息失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 创建新插件
 */
pluginRoutes.post('/', async (req: Request, res: Response) => {
    try {
        const { id, name, displayName, description, author, repository, icon } = req.body;
        
        if (!id || !name || !displayName) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数: id, name, displayName'
            });
        }
        
        // 检查插件ID是否已存在
        const existingPlugin = await queryOne('SELECT id FROM plugins WHERE id = ?', [id]);
        
        if (existingPlugin) {
            return res.status(400).json({
                success: false,
                error: '插件ID已存在'
            });
        }
        
        // 创建插件记录
        await execute(`
            INSERT INTO plugins 
            (id, name, display_name, description, author, repository, icon)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [id, name, displayName, description || '', author || '', repository || '', icon || '📦']);
        
        console.log(`✅ 新插件创建成功: ${displayName} (${id})`);
        
        res.json({
            success: true,
            data: {
                id,
                name,
                displayName,
                description: description || '',
                author: author || '',
                repository: repository || '',
                icon: icon || '📦',
                status: 'active'
            },
            message: '插件创建成功'
        });
        
    } catch (error) {
        console.error('创建插件失败:', error);
        res.status(500).json({
            success: false,
            error: '创建插件失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 更新插件信息
 */
pluginRoutes.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { displayName, description, author, repository, icon, status } = req.body;
        
        // 检查插件是否存在
        const existingPlugin = await queryOne('SELECT id FROM plugins WHERE id = ?', [id]);
        
        if (!existingPlugin) {
            return res.status(404).json({
                success: false,
                error: '插件不存在'
            });
        }
        
        // 更新插件信息
        await execute(`
            UPDATE plugins 
            SET display_name = ?, description = ?, author = ?, repository = ?, icon = ?, status = ?, updated_at = ?
            WHERE id = ?
        `, [displayName, description, author, repository, icon, status, new Date().toISOString(), id]);
        
        res.json({
            success: true,
            message: '插件信息更新成功'
        });
        
    } catch (error) {
        console.error('更新插件失败:', error);
        res.status(500).json({
            success: false,
            error: '更新插件失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 删除插件（软删除）
 */
pluginRoutes.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // 检查插件是否存在
        const existingPlugin = await queryOne('SELECT id FROM plugins WHERE id = ?', [id]);
        
        if (!existingPlugin) {
            return res.status(404).json({
                success: false,
                error: '插件不存在'
            });
        }
        
        // 检查是否有版本记录
        const versionCount = await queryOne('SELECT COUNT(*) as count FROM versions WHERE plugin_id = ?', [id]);
        
        if (versionCount && versionCount.count > 0) {
            // 如果有版本记录，只进行软删除
            await execute(`
                UPDATE plugins 
                SET status = 'inactive', updated_at = ?
                WHERE id = ?
            `, [new Date().toISOString(), id]);
            
            res.json({
                success: true,
                message: '插件已停用（因为存在版本记录）'
            });
        } else {
            // 如果没有版本记录，可以直接删除
            await execute('DELETE FROM plugins WHERE id = ?', [id]);
            
            res.json({
                success: true,
                message: '插件删除成功'
            });
        }
        
    } catch (error) {
        console.error('删除插件失败:', error);
        res.status(500).json({
            success: false,
            error: '删除插件失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 激活/停用插件
 */
pluginRoutes.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '无效的状态值，必须是 active 或 inactive'
            });
        }
        
        // 检查插件是否存在
        const existingPlugin = await queryOne('SELECT id FROM plugins WHERE id = ?', [id]);
        
        if (!existingPlugin) {
            return res.status(404).json({
                success: false,
                error: '插件不存在'
            });
        }
        
        // 更新状态
        await execute(`
            UPDATE plugins 
            SET status = ?, updated_at = ?
            WHERE id = ?
        `, [status, new Date().toISOString(), id]);
        
        res.json({
            success: true,
            message: `插件已${status === 'active' ? '激活' : '停用'}`
        });
        
    } catch (error) {
        console.error('更新插件状态失败:', error);
        res.status(500).json({
            success: false,
            error: '更新插件状态失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
}); 
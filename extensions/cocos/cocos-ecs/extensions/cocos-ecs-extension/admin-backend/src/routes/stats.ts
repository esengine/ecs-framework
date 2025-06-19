import { Router, Request, Response } from 'express';
import { query, queryOne, execute } from '../database';

export const statsRoutes = Router();

/**
 * 获取整体统计信息
 */
statsRoutes.get('/', async (req: Request, res: Response) => {
    try {
        // 插件数量统计
        const pluginStats = await query(`
            SELECT 
                COUNT(*) as total_plugins,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_plugins,
                COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_plugins
            FROM plugins
        `);
        
        // 版本数量统计
        const versionStats = await query(`
            SELECT 
                COUNT(*) as total_versions,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_versions,
                COUNT(CASE WHEN channel = 'stable' THEN 1 END) as stable_versions,
                COUNT(CASE WHEN channel = 'beta' THEN 1 END) as beta_versions,
                COUNT(CASE WHEN mandatory = 1 THEN 1 END) as mandatory_versions
            FROM versions
        `);
        
        // 文件数量统计
        const fileStats = await query(`
            SELECT 
                COUNT(*) as total_files,
                SUM(file_size) as total_size,
                AVG(file_size) as avg_file_size
            FROM version_files
        `);
        
        // 更新统计
        const updateStats = await query(`
            SELECT 
                SUM(user_count) as total_users,
                SUM(success_count) as total_success,
                SUM(failure_count) as total_failure
            FROM update_stats
        `);
        
        res.json({
            success: true,
            data: {
                plugins: pluginStats[0] || {},
                versions: versionStats[0] || {},
                files: fileStats[0] || {},
                updates: updateStats[0] || {}
            }
        });
        
    } catch (error) {
        console.error('获取统计信息失败:', error);
        res.status(500).json({
            success: false,
            error: '获取统计信息失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 获取插件使用统计
 */
statsRoutes.get('/plugins', async (req: Request, res: Response) => {
    try {
        const { limit = 10 } = req.query;
        
        const pluginStats = await query(`
            SELECT 
                p.id,
                p.display_name,
                p.icon,
                COUNT(v.id) as version_count,
                COALESCE(SUM(us.user_count), 0) as total_users,
                COALESCE(SUM(us.success_count), 0) as total_success,
                COALESCE(SUM(us.failure_count), 0) as total_failure,
                MAX(v.created_at) as latest_version_date
            FROM plugins p
            LEFT JOIN versions v ON p.id = v.plugin_id AND v.status = 'active'
            LEFT JOIN update_stats us ON p.id = us.plugin_id
            WHERE p.status = 'active'
            GROUP BY p.id, p.display_name, p.icon
            ORDER BY total_users DESC
            LIMIT ?
        `, [Number(limit)]);
        
        res.json({
            success: true,
            data: pluginStats
        });
        
    } catch (error) {
        console.error('获取插件统计失败:', error);
        res.status(500).json({
            success: false,
            error: '获取插件统计失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 获取版本使用统计
 */
statsRoutes.get('/versions', async (req: Request, res: Response) => {
    try {
        const { pluginId, days = 30 } = req.query;
        
        let sql = `
            SELECT 
                v.id,
                v.version,
                v.channel,
                v.release_date,
                p.display_name as plugin_name,
                COALESCE(us.user_count, 0) as user_count,
                COALESCE(us.success_count, 0) as success_count,
                COALESCE(us.failure_count, 0) as failure_count,
                CASE 
                    WHEN us.user_count > 0 
                    THEN ROUND((us.success_count * 1.0 / us.user_count) * 100, 2)
                    ELSE 0
                END as success_rate
            FROM versions v
            LEFT JOIN plugins p ON v.plugin_id = p.id
            LEFT JOIN update_stats us ON v.plugin_id = us.plugin_id AND v.version = us.version
            WHERE v.status = 'active'
              AND v.release_date >= date('now', '-' || ? || ' days')
        `;
        const params: any[] = [Number(days)];
        
        if (pluginId) {
            sql += ' AND v.plugin_id = ?';
            params.push(pluginId);
        }
        
        sql += ' ORDER BY v.release_date DESC';
        
        const versionStats = await query(sql, params);
        
        res.json({
            success: true,
            data: versionStats
        });
        
    } catch (error) {
        console.error('获取版本统计失败:', error);
        res.status(500).json({
            success: false,
            error: '获取版本统计失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 获取趋势统计
 */
statsRoutes.get('/trends', async (req: Request, res: Response) => {
    try {
        const { period = 'week' } = req.query;
        
        let dateFormat = '%Y-%m-%d';
        let dateInterval = '7 days';
        
        if (period === 'month') {
            dateFormat = '%Y-%m';
            dateInterval = '30 days';
        } else if (period === 'year') {
            dateFormat = '%Y';
            dateInterval = '365 days';
        }
        
        // 版本发布趋势
        const versionTrends = await query(`
            SELECT 
                strftime(?, release_date) as period,
                COUNT(*) as version_count,
                COUNT(CASE WHEN channel = 'stable' THEN 1 END) as stable_count,
                COUNT(CASE WHEN channel = 'beta' THEN 1 END) as beta_count
            FROM versions
            WHERE release_date >= date('now', '-' || ? || '')
              AND status = 'active'
            GROUP BY strftime(?, release_date)
            ORDER BY period DESC
            LIMIT 20
        `, [dateFormat, dateInterval, dateFormat]);
        
        // 更新使用趋势
        const updateTrends = await query(`
            SELECT 
                strftime(?, last_updated) as period,
                SUM(user_count) as total_users,
                SUM(success_count) as total_success,
                SUM(failure_count) as total_failure
            FROM update_stats
            WHERE last_updated >= date('now', '-' || ? || '')
            GROUP BY strftime(?, last_updated)
            ORDER BY period DESC
            LIMIT 20
        `, [dateFormat, dateInterval, dateFormat]);
        
        res.json({
            success: true,
            data: {
                versions: versionTrends,
                updates: updateTrends
            }
        });
        
    } catch (error) {
        console.error('获取趋势统计失败:', error);
        res.status(500).json({
            success: false,
            error: '获取趋势统计失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 记录更新成功
 */
statsRoutes.post('/success', async (req: Request, res: Response) => {
    try {
        const { pluginId, version } = req.body;
        
        if (!pluginId || !version) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数: pluginId, version'
            });
        }
        
        await execute(`
            UPDATE update_stats 
            SET success_count = success_count + 1, last_updated = ?
            WHERE plugin_id = ? AND version = ?
        `, [new Date().toISOString(), pluginId, version]);
        
        res.json({
            success: true,
            message: '更新成功记录已保存'
        });
        
    } catch (error) {
        console.error('记录更新成功失败:', error);
        res.status(500).json({
            success: false,
            error: '记录更新成功失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 记录更新失败
 */
statsRoutes.post('/failure', async (req: Request, res: Response) => {
    try {
        const { pluginId, version, error: errorMessage } = req.body;
        
        if (!pluginId || !version) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数: pluginId, version'
            });
        }
        
        await execute(`
            UPDATE update_stats 
            SET failure_count = failure_count + 1, last_updated = ?
            WHERE plugin_id = ? AND version = ?
        `, [new Date().toISOString(), pluginId, version]);
        
        console.log(`❌ 更新失败记录: ${pluginId} v${version} - ${errorMessage}`);
        
        res.json({
            success: true,
            message: '更新失败记录已保存'
        });
        
    } catch (error) {
        console.error('记录更新失败失败:', error);
        res.status(500).json({
            success: false,
            error: '记录更新失败失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
}); 
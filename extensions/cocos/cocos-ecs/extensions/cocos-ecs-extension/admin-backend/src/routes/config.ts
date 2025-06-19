import { Router, Request, Response } from 'express';
import { query, execute } from '../database';

export const configRoutes = Router();

/**
 * 获取所有配置
 */
configRoutes.get('/', async (req: Request, res: Response) => {
    try {
        const configs = await query(`
            SELECT key, value, description, updated_at
            FROM config
            ORDER BY key
        `);
        
        res.json({
            success: true,
            data: configs
        });
        
    } catch (error) {
        console.error('获取配置失败:', error);
        res.status(500).json({
            success: false,
            error: '获取配置失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 获取特定配置
 */
configRoutes.get('/:key', async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        
        const config = await query(`
            SELECT key, value, description, updated_at
            FROM config
            WHERE key = ?
        `, [key]);
        
        if (config.length === 0) {
            return res.status(404).json({
                success: false,
                error: '配置不存在'
            });
        }
        
        res.json({
            success: true,
            data: config[0]
        });
        
    } catch (error) {
        console.error('获取配置失败:', error);
        res.status(500).json({
            success: false,
            error: '获取配置失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 更新配置
 */
configRoutes.put('/:key', async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;
        
        if (value === undefined) {
            return res.status(400).json({
                success: false,
                error: '缺少配置值'
            });
        }
        
        // 检查配置是否存在
        const existing = await query('SELECT key FROM config WHERE key = ?', [key]);
        
        if (existing.length === 0) {
            // 创建新配置
            await execute(`
                INSERT INTO config (key, value, description, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `, [key, value, description || '']);
        } else {
            // 更新现有配置
            await execute(`
                UPDATE config 
                SET value = ?, description = ?, updated_at = CURRENT_TIMESTAMP
                WHERE key = ?
            `, [value, description || '', key]);
        }
        
        res.json({
            success: true,
            message: '配置更新成功'
        });
        
    } catch (error) {
        console.error('更新配置失败:', error);
        res.status(500).json({
            success: false,
            error: '更新配置失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 删除配置
 */
configRoutes.delete('/:key', async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        
        await execute('DELETE FROM config WHERE key = ?', [key]);
        
        res.json({
            success: true,
            message: '配置删除成功'
        });
        
    } catch (error) {
        console.error('删除配置失败:', error);
        res.status(500).json({
            success: false,
            error: '删除配置失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 批量更新配置
 */
configRoutes.post('/batch', async (req: Request, res: Response) => {
    try {
        const { configs } = req.body;
        
        if (!Array.isArray(configs)) {
            return res.status(400).json({
                success: false,
                error: '配置数据格式错误'
            });
        }
        
        for (const config of configs) {
            const { key, value, description } = config;
            
            if (!key || value === undefined) {
                continue;
            }
            
            // 检查配置是否存在
            const existing = await query('SELECT key FROM config WHERE key = ?', [key]);
            
            if (existing.length === 0) {
                await execute(`
                    INSERT INTO config (key, value, description, updated_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                `, [key, value, description || '']);
            } else {
                await execute(`
                    UPDATE config 
                    SET value = ?, description = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE key = ?
                `, [value, description || '', key]);
            }
        }
        
        res.json({
            success: true,
            message: '批量配置更新成功'
        });
        
    } catch (error) {
        console.error('批量更新配置失败:', error);
        res.status(500).json({
            success: false,
            error: '批量更新配置失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
}); 
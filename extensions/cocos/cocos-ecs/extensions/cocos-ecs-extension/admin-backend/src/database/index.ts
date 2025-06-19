import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs-extra';

// 数据库实例
export let db: sqlite3.Database;

/**
 * 插件信息接口
 */
export interface PluginInfo {
    id: string;
    name: string;
    displayName: string;
    description: string;
    author: string;
    repository: string;
    icon: string;
    status: 'active' | 'inactive';
}

/**
 * 初始化数据库
 */
export async function initDatabase(): Promise<void> {
    const dbPath = path.join(__dirname, '../../data/hotupdate.db');
    
    // 确保数据目录存在
    await fs.ensureDir(path.dirname(dbPath));
    
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err: any) => {
            if (err) {
                console.error('数据库连接失败:', err);
                reject(err);
                return;
            }
            
            console.log('✅ 数据库连接成功');
            createTables().then(resolve).catch(reject);
        });
    });
}

/**
 * 创建数据表
 */
async function createTables(): Promise<void> {
    const run = promisify(db.run.bind(db));
    
    try {
        // 插件信息表
        await run(`
            CREATE TABLE IF NOT EXISTS plugins (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                description TEXT,
                author TEXT,
                repository TEXT,
                icon TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 版本信息表 - 添加plugin_id字段
        await run(`
            CREATE TABLE IF NOT EXISTS versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plugin_id TEXT NOT NULL,
                version TEXT NOT NULL,
                channel TEXT NOT NULL DEFAULT 'stable',
                release_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                description TEXT,
                download_url TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                checksum TEXT NOT NULL,
                mandatory BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (plugin_id) REFERENCES plugins (id) ON DELETE CASCADE,
                UNIQUE(plugin_id, version, channel)
            )
        `);
        
        // 版本文件表
        await run(`
            CREATE TABLE IF NOT EXISTS version_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_hash TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                action TEXT NOT NULL DEFAULT 'update',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (version_id) REFERENCES versions (id) ON DELETE CASCADE
            )
        `);
        
        // 用户表
        await run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 更新统计表 - 添加plugin_id字段
        await run(`
            CREATE TABLE IF NOT EXISTS update_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plugin_id TEXT NOT NULL,
                version TEXT NOT NULL,
                user_count INTEGER DEFAULT 0,
                success_count INTEGER DEFAULT 0,
                failure_count INTEGER DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (plugin_id) REFERENCES plugins (id) ON DELETE CASCADE
            )
        `);
        
        // 配置表
        await run(`
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                description TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
            console.log('✅ 数据表创建成功');
    
    // 插入默认数据
    await insertDefaultData();
        
    } catch (error) {
        console.error('❌ 数据表创建失败:', error);
        throw error;
    }
}

/**
 * 插入默认数据
 */
async function insertDefaultData(): Promise<void> {
    const run = promisify(db.run.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
    
    // 插入默认插件
    const defaultPlugins: PluginInfo[] = [
        {
            id: 'cocos-ecs-extension',
            name: 'cocos-ecs-extension',
            displayName: 'Cocos ECS Framework',
            description: '为Cocos Creator提供高性能ECS框架支持',
            author: 'esengine',
            repository: 'https://github.com/esengine/ecs-framework',
            icon: '🎮',
            status: 'active'
        },
        {
            id: 'behaviour-tree-ai',
            name: 'behaviour-tree-ai',
            displayName: 'Behaviour Tree AI',
            description: '智能行为树AI系统，支持可视化编辑',
            author: 'esengine',
            repository: 'https://github.com/esengine/ecs-framework/tree/master/thirdparty/BehaviourTree-ai',
            icon: '🧠',
            status: 'active'
        }
    ];
    
    for (const plugin of defaultPlugins) {
        try {
            await run(
                `INSERT OR IGNORE INTO plugins 
                (id, name, display_name, description, author, repository, icon, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [plugin.id, plugin.name, plugin.displayName, plugin.description, 
                 plugin.author, plugin.repository, plugin.icon, plugin.status]
            );
        } catch (error) {
            console.warn('插件数据插入失败:', plugin.id);
        }
    }
    
    // 插入默认配置
    const defaultConfigs = [
        { key: 'server_url', value: 'http://localhost:3001', description: '服务器地址' },
        { key: 'cdn_url', value: 'https://cdn.earthonline-game.cn', description: 'CDN地址' },
        { key: 'auto_backup', value: 'true', description: '自动备份' },
        { key: 'max_backup_count', value: '5', description: '最大备份数量' },
        { key: 'upload_max_size', value: '100', description: '上传文件最大大小(MB)' }
    ];
    
    for (const config of defaultConfigs) {
        try {
            await run(
                'INSERT OR IGNORE INTO config (key, value, description) VALUES (?, ?, ?)',
                [config.key, config.value, config.description]
            );
        } catch (error) {
            console.warn('配置插入失败:', config.key);
        }
    }
    
    // 插入默认管理员用户
    const bcrypt = require('bcryptjs');
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    try {
        await run(
            'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            ['admin', hashedPassword, 'admin']
        );
        console.log('✅ 默认管理员账户创建成功 (用户名: admin, 密码: admin123)');
    } catch (error) {
        console.warn('默认用户创建失败:', error);
    }
}



/**
 * 执行查询
 */
export function query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err: any, rows: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * 执行单个查询
 */
export function queryOne(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err: any, row: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * 执行更新/插入
 */
export function execute(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err: any) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: (this as any).lastID, changes: (this as any).changes });
            }
        });
    });
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
    db.close();
} 
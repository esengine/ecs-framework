import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as cors from 'cors';
import * as path from 'path';
import { authRoutes } from './routes/auth';
import { uploadRoutes } from './routes/upload';
import { versionRoutes } from './routes/versions';
import { configRoutes } from './routes/config';
import { statsRoutes } from './routes/stats';
import { initDatabase } from './database';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/config', configRoutes);
app.use('/api/stats', statsRoutes);

// 热更新客户端API (供Cocos Creator插件使用)
app.post('/api/plugin-updates/check', (req: Request, res: Response) => {
    // 检查插件更新
    res.json({ 
        message: '当前已是最新版本',
        hasUpdate: false,
        currentVersion: req.body?.currentVersion || '1.0.0'
    });
});

// 管理界面路由
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/admin', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 健康检查
app.get('/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 错误处理中间件
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员'
    });
});

// 404处理
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
async function startServer() {
    try {
        // 初始化数据库
        await initDatabase();
        
        app.listen(PORT, () => {
            console.log(`🚀 热更新管理后台启动成功!`);
            console.log(`📍 服务地址: http://localhost:${PORT}`);
            console.log(`📱 管理界面: http://localhost:${PORT}`);
            console.log(`📱 管理界面(admin): http://localhost:${PORT}/admin`);
            console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

startServer(); 
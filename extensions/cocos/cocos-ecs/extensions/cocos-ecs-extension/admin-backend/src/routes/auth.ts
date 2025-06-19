import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { query, execute } from '../database';

export const authRoutes = Router();

// JWT密钥 - 生产环境应该从环境变量读取
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

interface LoginRequest {
    username: string;
    password: string;
}

interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
    };
}

/**
 * 登录
 */
authRoutes.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password }: LoginRequest = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: '用户名和密码不能为空'
            });
        }
        
        // 查找用户
        const users = await query(`
            SELECT id, username, password_hash, role
            FROM users
            WHERE username = ?
        `, [username]);
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误'
            });
        }
        
        const user = users[0];
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误'
            });
        }
        
        // 生成JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // 更新最后登录时间
        await execute(`
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [user.id]);
        
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            }
        });
        
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({
            success: false,
            error: '登录失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * 验证token
 */
authRoutes.get('/verify', authenticateToken, (req: AuthRequest, res: Response) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
});

/**
 * 登出 (清除客户端token即可)
 */
authRoutes.post('/logout', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: '登出成功'
    });
});

/**
 * 修改密码
 */
authRoutes.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: '当前密码和新密码不能为空'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: '新密码长度不能少于6位'
            });
        }
        
        // 获取当前用户信息
        const users = await query(`
            SELECT password_hash FROM users WHERE id = ?
        `, [req.user!.id]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }
        
        // 验证当前密码
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
        
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                error: '当前密码错误'
            });
        }
        
        // 加密新密码
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // 更新密码
        await execute(`
            UPDATE users 
            SET password_hash = ? 
            WHERE id = ?
        `, [hashedNewPassword, req.user!.id]);
        
        res.json({
            success: true,
            message: '密码修改成功'
        });
        
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({
            success: false,
            error: '修改密码失败',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * JWT Token验证中间件
 */
export function authenticateToken(req: AuthRequest, res: Response, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: '访问令牌缺失'
        });
    }
    
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: '访问令牌无效或已过期'
            });
        }
        
        req.user = user;
        next();
    });
} 
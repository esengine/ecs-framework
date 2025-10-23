/**
 * 清理开发服务器进程
 * 用于 Windows 平台自动清理残留的 Vite 进程
 */

import { execSync } from 'child_process';

const PORT = 5173;

try {
    console.log(`正在查找占用端口 ${PORT} 的进程...`);

    // Windows 命令
    const result = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });

    // 解析 PID
    const lines = result.split('\n');
    const pids = new Set();

    for (const line of lines) {
        if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') {
                pids.add(pid);
            }
        }
    }

    if (pids.size === 0) {
        console.log(`✓ 端口 ${PORT} 未被占用`);
    } else {
        console.log(`发现 ${pids.size} 个进程占用端口 ${PORT}`);
        for (const pid of pids) {
            try {
                // Windows 需要使用 /F /PID 而不是 //F //PID
                execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf8', stdio: 'ignore' });
                console.log(`✓ 已终止进程 PID: ${pid}`);
            } catch (e) {
                console.log(`✗ 无法终止进程 PID: ${pid}`);
            }
        }
    }
} catch (error) {
    // 如果 netstat 没有找到结果，会抛出错误，这是正常的
    console.log(`✓ 端口 ${PORT} 未被占用`);
}

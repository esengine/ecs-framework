#!/usr/bin/env node

/**
 * 同步 package.json 和 tauri.conf.json 的版本号
 * 在 npm version 命令执行后自动运行
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 package.json
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const newVersion = packageJson.version;

// 读取 tauri.conf.json
const tauriConfigPath = join(__dirname, '../src-tauri/tauri.conf.json');
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf8'));

// 更新 tauri.conf.json 的版本号
const oldVersion = tauriConfig.version;
tauriConfig.version = newVersion;

// 写回文件（保持格式）
writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n', 'utf8');

console.log(`✓ Version synced: ${oldVersion} → ${newVersion}`);
console.log(`  - package.json: ${newVersion}`);
console.log(`  - tauri.conf.json: ${newVersion}`);

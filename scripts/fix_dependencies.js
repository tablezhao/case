import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 开始修复依赖问题...');

// 1. 清理现有的node_modules和锁文件
console.log('📦 清理现有依赖...');
try {
  if (fs.existsSync('node_modules')) {
    execSync('rmdir /s /q node_modules', { stdio: 'inherit', shell: 'cmd.exe' });
    console.log('✅ 已删除 node_modules');
  }
  
  if (fs.existsSync('pnpm-lock.yaml')) {
    fs.unlinkSync('pnpm-lock.yaml');
    console.log('✅ 已删除 pnpm-lock.yaml');
  }
  
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
    console.log('✅ 已删除 package-lock.json');
  }
} catch (error) {
  console.log('⚠️  清理过程中出现警告:', error.message);
}

// 2. 创建.npmrc配置文件
console.log('⚙️  配置npm源...');
const npmrcContent = `# 使用官方npm源
registry=https://registry.npmjs.org/

# 如果官方源访问慢，可以切换到淘宝镜像源（取消下面注释）
# registry=https://registry.npmmirror.com/

# 设置超时时间
fetch-timeout=30000
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000
`;

try {
  fs.writeFileSync('.npmrc', npmrcContent);
  console.log('✅ 已创建 .npmrc 配置文件');
} catch (error) {
  console.error('❌ 创建 .npmrc 失败:', error.message);
  process.exit(1);
}

// 3. 安装依赖
console.log('📥 开始安装依赖...');
try {
  // 使用npm安装，避免pnpm的缓存问题
  execSync('npm install --legacy-peer-deps --no-fund --no-audit', { stdio: 'inherit' });
  console.log('✅ 依赖安装成功！');
} catch (error) {
  console.error('❌ 依赖安装失败:', error.message);
  
  // 如果仍然失败，尝试强制安装
  console.log('🔄 尝试强制安装...');
  try {
    execSync('npm install --force --legacy-peer-deps --no-fund --no-audit', { stdio: 'inherit' });
    console.log('✅ 强制安装成功！');
  } catch (forceError) {
    console.error('❌ 强制安装也失败了:', forceError.message);
    console.log('💡 建议手动检查网络连接或尝试使用其他网络');
    process.exit(1);
  }
}

console.log('🎉 依赖修复完成！');
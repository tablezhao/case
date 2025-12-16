# browser_title字段缺失问题修复说明

## 📋 问题描述

**错误信息：**
```
Column 'browser_title' of relation 'site_settings' does not exist
```

**问题原因：**
Migration 00015 (`add_browser_title_to_site_settings.sql`) 还没有被应用到数据库。

---

## ✅ 已执行的修复

### 1. 应用Migration

已通过 `supabase_apply_migration` 工具成功应用了Migration：

```sql
-- 添加浏览器标题字段
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS browser_title text CHECK (char_length(browser_title) <= 100);

-- 为现有记录设置默认值
UPDATE site_settings
SET browser_title = '合规通 Case Wiki'
WHERE browser_title IS NULL;

-- 添加注释
COMMENT ON COLUMN site_settings.browser_title IS '浏览器标签页显示的标题，最多100个字符';
```

**执行结果：** ✅ 成功

---

## 🧪 验证步骤

### 方法1：通过Supabase Dashboard验证

1. 登录 Supabase Dashboard
2. 进入项目：`app-800go8thhcsh`
3. 点击左侧菜单 **Table Editor**
4. 选择 `site_settings` 表
5. 检查表结构，应该能看到 `browser_title` 字段

### 方法2：通过SQL查询验证

在Supabase Dashboard的SQL Editor中执行：

```sql
-- 查询表结构
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'site_settings'
ORDER BY ordinal_position;
```

**预期结果：**
应该能看到以下字段：
- `id` (uuid)
- `site_title` (text)
- `site_subtitle` (text)
- `logo_url` (text)
- `browser_title` (text) ✅ 新增字段
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 方法3：通过前端测试验证

1. 登录管理后台
2. 进入"网站信息配置"页面
3. 尝试修改"浏览器标签标题"字段
4. 点击"保存更改"
5. 应该能成功保存，不再出现错误

---

## 📊 字段说明

### browser_title字段

| 属性 | 值 |
|------|-----|
| **字段名** | `browser_title` |
| **类型** | `text` |
| **可空** | 是（可选字段） |
| **最大长度** | 100个字符 |
| **默认值** | `'合规通 Case Wiki'` |
| **用途** | 控制浏览器标签页显示的标题 |
| **约束** | `CHECK (char_length(browser_title) <= 100)` |

### 使用说明

**前端使用：**
```typescript
// src/hooks/useBrowserTitle.ts
export function useBrowserTitle() {
  useEffect(() => {
    const updateTitle = async () => {
      try {
        const settings = await getSiteSettings();
        if (settings?.browser_title) {
          document.title = settings.browser_title;
        } else {
          // 如果没有配置，使用默认标题
          document.title = '合规通 Case Wiki';
        }
      } catch (error) {
        console.error('获取浏览器标题失败:', error);
        document.title = '合规通 Case Wiki';
      }
    };
    updateTitle();
  }, []);
}
```

**管理后台配置：**
1. 进入"网站信息配置"页面
2. 找到"浏览器标签标题"输入框
3. 输入自定义标题（最多100个字符）
4. 点击"保存更改"
5. 刷新前台页面，浏览器标签页标题将更新

---

## 🔧 如果问题仍然存在

### 情况1：Migration未成功应用

**症状：**
- 保存时仍然提示字段不存在
- Supabase Dashboard中看不到 `browser_title` 字段

**解决方案：**

#### 方法A：通过Supabase Dashboard手动执行

1. 登录 Supabase Dashboard
2. 进入项目：`app-800go8thhcsh`
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New query**
5. 粘贴以下SQL：

```sql
-- 添加浏览器标题字段
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS browser_title text CHECK (char_length(browser_title) <= 100);

-- 为现有记录设置默认值
UPDATE site_settings
SET browser_title = '合规通 Case Wiki'
WHERE browser_title IS NULL;

-- 添加注释
COMMENT ON COLUMN site_settings.browser_title IS '浏览器标签页显示的标题，最多100个字符';
```

6. 点击 **Run** 执行
7. 检查执行结果

#### 方法B：通过Supabase CLI

如果安装了Supabase CLI：

```bash
# 进入项目目录
cd /workspace/app-800go8thhcsh

# 应用Migration
supabase db push

# 或者直接执行SQL文件
supabase db execute -f supabase/migrations/00015_add_browser_title_to_site_settings.sql
```

### 情况2：缓存问题

**症状：**
- 字段已存在，但前端仍然报错
- Supabase Dashboard中能看到字段

**解决方案：**

1. **清除浏览器缓存**
   - Chrome: Ctrl+Shift+Delete
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

2. **重启开发服务器**
   ```bash
   # 停止服务器（Ctrl+C）
   # 重新启动
   cd /workspace/app-800go8thhcsh
   pnpm run dev
   ```

3. **清除应用缓存**
   - 打开浏览器开发者工具（F12）
   - 切换到"Application"标签
   - 点击"Clear storage"
   - 勾选所有选项
   - 点击"Clear site data"

### 情况3：类型定义未更新

**症状：**
- TypeScript报错
- 类型检查失败

**解决方案：**

检查 `src/types/types.ts` 文件，确保包含 `browser_title` 字段：

```typescript
export interface SiteSettings {
  id: string;
  site_title: string;
  site_subtitle: string | null;
  browser_title: string | null; // ✅ 确保这行存在
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}
```

如果缺少，请添加这个字段。

---

## 📝 相关文件

### Migration文件

| 文件 | 说明 |
|------|------|
| `supabase/migrations/00014_create_site_settings_table.sql` | 创建site_settings表 |
| `supabase/migrations/00015_add_browser_title_to_site_settings.sql` | 添加browser_title字段 ✅ |

### 代码文件

| 文件 | 说明 |
|------|------|
| `src/types/types.ts` | TypeScript类型定义 |
| `src/hooks/useBrowserTitle.ts` | 浏览器标题Hook |
| `src/pages/admin/SiteSettingsPage.tsx` | 网站信息配置页面 |
| `src/db/api.ts` | 数据库API函数 |

---

## 🔍 调试技巧

### 1. 检查表结构

在Supabase Dashboard的SQL Editor中执行：

```sql
-- 方法1：查询列信息
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'site_settings'
ORDER BY ordinal_position;

-- 方法2：查询表定义
SELECT 
  pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
  a.attname as column_name,
  a.attnotnull as not_null
FROM pg_catalog.pg_attribute a
WHERE a.attrelid = 'site_settings'::regclass
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;
```

### 2. 检查数据

```sql
-- 查询现有数据
SELECT * FROM site_settings;

-- 检查browser_title字段的值
SELECT id, site_title, browser_title FROM site_settings;
```

### 3. 检查约束

```sql
-- 查询表约束
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'site_settings'::regclass;
```

### 4. 浏览器控制台日志

打开浏览器开发者工具（F12），查看Console标签：

```javascript
// 应该能看到类似的日志
准备更新配置，Logo URL: ...
配置更新成功
```

如果看到错误：
```
Column 'browser_title' of relation 'site_settings' does not exist
```

说明Migration还没有成功应用。

---

## ✅ 验证清单

修复后，请验证：

- [ ] Supabase Dashboard中能看到 `browser_title` 字段
- [ ] 字段类型为 `text`
- [ ] 字段可以为空（nullable）
- [ ] 字段有长度约束（最大100字符）
- [ ] 现有记录的 `browser_title` 值为 `'合规通 Case Wiki'`
- [ ] 管理后台可以正常编辑该字段
- [ ] 保存时不再出现错误
- [ ] 前台页面的浏览器标题正确显示
- [ ] TypeScript类型定义包含该字段
- [ ] 没有类型检查错误

---

## 📞 需要帮助？

如果按照以上步骤仍然无法解决问题，请：

1. **检查Supabase项目状态**
   - 确保项目处于活跃状态
   - 检查数据库连接是否正常

2. **查看详细错误日志**
   - 浏览器控制台（F12 → Console）
   - 网络请求（F12 → Network）
   - Supabase Dashboard → Logs

3. **提供以下信息**
   - 完整的错误信息
   - 浏览器控制台截图
   - Supabase Dashboard中的表结构截图
   - 执行SQL的结果

---

## 📚 相关文档

- `Logo保存失败问题修复说明.md` - Logo保存问题修复
- `网站Logo更换完整指南.md` - Logo更换操作指南
- `Supabase存储桶问题说明.md` - 存储桶问题说明

---

**文档版本：** v1.0  
**创建时间：** 2025-12-04  
**修复状态：** ✅ Migration已应用  
**验证状态：** ⏳ 待用户验证

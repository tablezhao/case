# Logo上传功能修复指南

## 📋 问题描述

**问题**: Logo上传功能失败  
**原因**: Supabase存储桶 `app-800go8thhcsh_logos` 不存在  
**影响**: 无法通过管理后台上传和更换网站Logo

---

## 🔍 问题诊断

### 1. 检查结果

```bash
✅ site_settings表存在
❌ Logo存储桶不存在
```

### 2. 根本原因

在当前Supabase实例中，通过SQL Migration直接插入`storage.buckets`表的方式不起作用。
存储桶需要通过以下方式之一创建：
1. Supabase Dashboard手动创建
2. 使用Service Role Key通过API创建
3. 使用Supabase CLI

---

## ✅ 解决方案

### 方案一：手动创建存储桶（推荐）

#### 步骤1：访问Supabase Dashboard

1. 登录Supabase Dashboard
2. 选择项目：`app-800go8thhcsh`
3. 在左侧菜单中点击 **Storage**

#### 步骤2：创建新存储桶

点击 **New bucket** 按钮，填写以下信息：

| 配置项 | 值 |
|--------|-----|
| **Bucket name** | `app-800go8thhcsh_logos` |
| **Public bucket** | ✅ 勾选（启用公开访问） |
| **File size limit** | `2 MB` (2097152 bytes) |
| **Allowed MIME types** | `image/png`, `image/jpeg`, `image/svg+xml` |

#### 步骤3：配置访问策略

创建存储桶后，需要设置以下访问策略：

##### 策略1：所有人可读

```sql
CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-800go8thhcsh_logos');
```

##### 策略2：仅管理员可上传

```sql
CREATE POLICY "Only admins can upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'app-800go8thhcsh_logos' 
    AND is_admin(auth.uid())
  );
```

##### 策略3：仅管理员可更新

```sql
CREATE POLICY "Only admins can update logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'app-800go8thhcsh_logos' 
    AND is_admin(auth.uid())
  );
```

##### 策略4：仅管理员可删除

```sql
CREATE POLICY "Only admins can delete logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'app-800go8thhcsh_logos' 
    AND is_admin(auth.uid())
  );
```

#### 步骤4：验证创建成功

运行验证脚本：

```bash
VITE_SUPABASE_URL="你的URL" VITE_SUPABASE_ANON_KEY="你的KEY" node check_logo_bucket.js
```

预期输出：

```
✅ Logo存储桶存在
   - ID: app-800go8thhcsh_logos
   - 名称: app-800go8thhcsh_logos
   - 公开访问: true
   - 文件大小限制: 2.00MB
   - 允许的MIME类型: image/png, image/jpeg, image/svg+xml
```

---

### 方案二：使用外部图片URL（临时方案）

如果暂时无法创建存储桶，可以使用外部图片URL作为Logo：

#### 步骤1：上传Logo到图床

将Logo图片上传到以下任一图床服务：
- [ImgBB](https://imgbb.com/)
- [Imgur](https://imgur.com/)
- [SM.MS](https://sm.ms/)
- 或您自己的CDN服务

#### 步骤2：获取图片URL

上传后获取图片的直接访问URL，例如：
```
https://i.imgur.com/xxxxx.png
```

#### 步骤3：在管理后台设置

1. 登录管理后台
2. 进入 **网站信息配置**
3. 在 **Logo图片URL** 字段中直接粘贴外部图片URL
4. 点击 **保存**

**注意**：使用此方案时，不要点击"上传Logo"按钮，直接在URL字段中填写外部链接即可。

---

## 🧪 测试验证

### 1. 验证存储桶状态

```bash
node check_logo_bucket.js
```

### 2. 测试Logo上传

1. 登录管理后台（需要管理员账号）
2. 进入 **网站信息配置**
3. 点击 **上传Logo** 按钮
4. 选择一张图片（PNG/JPG/SVG，小于2MB）
5. 点击 **保存**

### 3. 验证前端显示

1. 访问网站首页
2. 检查页面顶部Header是否显示新Logo
3. 检查移动端菜单中是否显示新Logo

---

## 📝 相关文件

### Migration文件

- `supabase/migrations/00014_create_site_settings_table.sql` - 原始创建（未生效）
- `supabase/migrations/00023_fix_logo_bucket_creation.sql` - 修复尝试（未生效）

### 代码文件

- `src/pages/admin/SiteSettingsPage.tsx` - 网站设置页面
- `src/components/common/Header.tsx` - 页面头部组件
- `src/db/api.ts` - API函数（uploadLogo, deleteLogo）

### 测试脚本

- `check_logo_bucket.js` - 检查存储桶状态
- `create_logo_bucket.js` - 尝试创建存储桶（需要service_role权限）

---

## 🔧 技术细节

### 存储桶配置

```javascript
{
  id: 'app-800go8thhcsh_logos',
  name: 'app-800go8thhcsh_logos',
  public: true,
  file_size_limit: 2097152, // 2MB
  allowed_mime_types: ['image/png', 'image/jpeg', 'image/svg+xml']
}
```

### 上传逻辑

```typescript
// 1. 生成唯一文件名
const fileExt = file.name.split('.').pop();
const fileName = `logo-${Date.now()}.${fileExt}`;

// 2. 上传到存储桶
const { error } = await supabase.storage
  .from('app-800go8thhcsh_logos')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  });

// 3. 获取公开URL
const { data } = supabase.storage
  .from('app-800go8thhcsh_logos')
  .getPublicUrl(fileName);

// 4. 保存到数据库
await updateSiteSettings(settingsId, {
  logo_url: data.publicUrl
});
```

### 删除逻辑

```typescript
// 1. 从URL提取文件名
const urlParts = url.split('/');
const fileName = urlParts[urlParts.length - 1];

// 2. 从存储桶删除
await supabase.storage
  .from('app-800go8thhcsh_logos')
  .remove([fileName]);
```

---

## ⚠️ 注意事项

### 1. 权限要求

- **上传Logo**: 需要管理员权限
- **查看Logo**: 所有用户（包括未登录用户）

### 2. 文件限制

- **格式**: PNG, JPG, SVG
- **大小**: 最大2MB
- **建议尺寸**: 宽度200-400px，高度自适应

### 3. 浏览器缓存

Logo更换后，如果浏览器仍显示旧Logo，请：
1. 清除浏览器缓存
2. 或使用 Ctrl+F5 强制刷新

### 4. CDN缓存

如果使用了CDN，Logo更新可能需要等待CDN缓存过期（通常1小时）。

---

## 🆘 常见问题

### Q1: 上传时提示"new row violates row-level security policy"

**原因**: 当前用户不是管理员，或存储桶策略配置错误

**解决**:
1. 确认当前用户是管理员角色
2. 检查存储桶策略是否正确配置
3. 确认`is_admin()`函数正常工作

### Q2: 上传成功但前端不显示

**原因**: 
1. 浏览器缓存
2. Logo URL未正确保存到数据库
3. Header组件未正确加载配置

**解决**:
1. 清除浏览器缓存并刷新
2. 检查数据库中`site_settings.logo_url`字段
3. 检查浏览器控制台是否有错误

### Q3: 存储桶创建失败

**原因**: 没有足够的权限

**解决**: 使用方案一手动创建，或联系Supabase项目管理员

### Q4: 图片显示不完整或变形

**原因**: CSS样式问题

**解决**: 检查`Header.tsx`中的图片样式：
```tsx
<img 
  src={siteSettings.logo_url} 
  alt={siteSettings.site_title}
  className="h-8 w-auto object-contain"
/>
```

---

## 📞 技术支持

如遇到其他问题，请提供以下信息：

1. 错误截图或错误信息
2. 浏览器控制台日志
3. 当前用户角色
4. 存储桶状态检查结果

---

**文档版本**: v1.0  
**更新时间**: 2025-12-04  
**状态**: ⚠️ 待修复

# Favicon管理功能实现计划

## 1. 功能需求分析

需要在网站基本信息配置页面中添加完整的favicon管理功能，包括：
- favicon图片上传区域（支持.png、.ico格式，建议尺寸为16×16px、32×32px、48×48px）
- 当前favicon预览区
- 删除按钮及确认机制
- 保存配置按钮
- 图片上传至服务器指定目录
- 自动生成不同尺寸的图标文件
- 更新网站HTML头部favicon引用路径
- 上传过程进度提示
- 文件格式和大小验证（单个文件不超过2MB）
- 错误处理机制
- 与现有网站配置系统的数据存储方案保持一致
- 符合现有后台管理系统的UI风格
- 响应式布局适配不同设备

## 2. 实现步骤

### 2.1 扩展类型定义

**文件**：`src/types/types.ts`
**修改**：扩展`SiteSettings`接口，添加`favicon_url`字段

```typescript
export interface SiteSettings {
  id: string;
  site_title: string;
  site_subtitle: string | null;
  browser_title: string | null;
  logo_url: string | null;
  favicon_url: string | null; // 新增favicon字段
  created_at: string;
  updated_at: string;
}
```

### 2.2 添加API函数

**文件**：`src/db/api.ts`
**修改**：添加favicon相关API函数

1. 添加`uploadFavicon`函数：上传favicon文件到Supabase Storage
2. 添加`deleteFavicon`函数：删除favicon文件
3. 更新`updateSiteSettings`函数：支持更新favicon_url字段

### 2.3 修改前端页面

**文件**：`src/pages/admin/SiteSettingsPage.tsx`
**修改**：添加favicon管理功能模块

1. **添加状态变量**：
   - `faviconUrl`: 存储当前favicon URL
   - `faviconFile`: 存储选择的favicon文件
   - `faviconPreview`: 存储favicon预览URL
   - `useFaviconUrlInput`: 控制是否使用URL输入模式
   - `faviconUrlInput`: 存储favicon URL输入值
   - `faviconImageLoadError`: 处理favicon图片加载错误

2. **添加UI组件**：
   - 标题和说明文字
   - 切换输入方式按钮（上传文件/输入URL）
   - 上传文件区域
   - URL输入区域
   - favicon预览区
   - 删除按钮
   - 上传说明

3. **添加功能函数**：
   - `handleFaviconFileSelect`: 处理favicon文件选择和验证
   - `handleRemoveFavicon`: 处理favicon删除
   - 更新`handleSave`: 添加favicon处理逻辑

4. **文件验证逻辑**：
   - 支持的文件类型：.png, .ico
   - 文件大小限制：2MB

5. **删除确认机制**：
   - 使用确认对话框或二次确认按钮

6. **响应式设计**：
   - 使用现有的UI组件和布局方式
   - 确保在不同设备上正常显示

### 2.4 实现文件上传和处理

1. **上传至服务器**：使用Supabase Storage存储favicon文件
2. **自动生成不同尺寸**：
   - 由于Supabase Storage不直接支持图片处理，我们可以在前端使用Canvas API生成不同尺寸的favicon
   - 或者在服务器端实现图片处理逻辑
   - 本次实现将先支持上传单个文件，后续可扩展为自动生成不同尺寸

3. **更新HTML头部引用**：
   - 在网站模板中添加favicon引用
   - 使用存储的favicon_url更新引用路径

## 3. 技术细节

### 3.1 文件上传实现

- 使用现有的Supabase Storage上传功能
- 存储桶：与Logo使用相同的存储桶或创建新的favicon存储桶
- 文件命名：`favicon-${Date.now()}.${ext}`

### 3.2 验证逻辑

```typescript
// 文件类型验证
const allowedTypes = ['image/png', 'image/x-icon'];
// 文件大小验证（2MB）
const maxSize = 2 * 1024 * 1024;
```

### 3.3 UI设计

- 遵循现有Logo上传组件的设计风格
- 使用相同的UI组件库（shadcn/ui）
- 保持一致的颜色、字体和间距

### 3.4 响应式布局

- 使用现有的响应式设计方案
- 确保在移动设备上正常显示

## 4. 实现顺序

1. 扩展类型定义
2. 添加API函数
3. 修改前端页面，添加favicon管理UI
4. 实现文件上传和验证逻辑
5. 实现预览功能
6. 实现删除功能和确认机制
7. 实现保存功能
8. 测试和优化

## 5. 预期效果

- 管理员可以在网站基本信息配置页面中上传、预览和删除favicon
- 上传过程有进度提示
- 文件格式和大小得到验证
- 删除操作有确认机制
- favicon设置保存后立即生效
- 界面设计符合现有后台管理系统的UI风格
- 适配不同设备的响应式布局

## 6. 后续扩展

- 自动生成不同尺寸的favicon文件
- 支持更多favicon格式
- 添加favicon压缩功能
- 支持favicon预览的不同尺寸展示
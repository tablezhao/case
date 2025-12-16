# 浏览器标签页Logo的其他修改方式

## 📋 概述

除了直接上传和替换favicon文件外，还有多种灵活的方式可以修改浏览器标签页图标。本文档详细介绍这些替代方案。

---

## 🎯 方案对比

| 方案 | 难度 | 灵活性 | 推荐度 | 适用场景 |
|------|------|--------|--------|---------|
| 方案1：管理后台配置 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 需要经常更换favicon |
| 方案2：使用外部URL | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 快速测试或临时使用 |
| 方案3：使用Data URL | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 小图标，减少HTTP请求 |
| 方案4：动态JavaScript | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 需要根据条件切换 |
| 方案5：SVG代码嵌入 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 简单图标，矢量清晰 |

---

## 🚀 方案1：通过管理后台配置（推荐）

### 优点
- ✅ 用户友好，无需技术知识
- ✅ 可视化操作，实时预览
- ✅ 支持URL输入或文件上传
- ✅ 统一管理，便于维护

### 实现步骤

#### 1. 扩展数据库表

在 `site_settings` 表中添加 `favicon_url` 字段：

```sql
-- 添加到现有的 site_settings 表
ALTER TABLE site_settings 
ADD COLUMN favicon_url text;

COMMENT ON COLUMN site_settings.favicon_url IS '浏览器标签页图标URL';
```

#### 2. 更新类型定义

修改 `src/types/types.ts`：

```typescript
export interface SiteSettings {
  id: string;
  site_title: string;
  site_subtitle: string | null;
  browser_title: string | null;
  logo_url: string | null;
  favicon_url: string | null; // 新增
  created_at: string;
  updated_at: string;
}
```

#### 3. 更新API函数

修改 `src/db/api.ts`，在 `updateSiteSettings` 函数中添加 `favicon_url` 支持：

```typescript
export async function updateSiteSettings(
  id: string,
  updates: {
    site_title?: string;
    site_subtitle?: string | null;
    browser_title?: string | null;
    logo_url?: string | null;
    favicon_url?: string | null; // 新增
  }
): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`更新网站配置失败: ${error.message}`);
  }
}
```

#### 4. 修改管理后台页面

在 `src/pages/admin/SiteSettingsPage.tsx` 中添加Favicon配置：

```tsx
// 添加状态
const [faviconUrl, setFaviconUrl] = useState('');
const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

// 在loadSettings中加载
const loadSettings = async () => {
  // ... 现有代码
  setFaviconUrl(data.favicon_url || '');
  setFaviconPreview(data.favicon_url);
};

// 在handleSave中保存
const handleSave = async () => {
  // ... 现有代码
  await updateSiteSettings(settings.id, {
    // ... 现有字段
    favicon_url: faviconUrl.trim() || null,
  });
};

// 在JSX中添加UI
<div className="space-y-4">
  <div>
    <Label htmlFor="favicon-url">浏览器标签页图标URL</Label>
    <Input
      id="favicon-url"
      value={faviconUrl}
      onChange={(e) => {
        setFaviconUrl(e.target.value);
        setFaviconPreview(e.target.value || null);
      }}
      placeholder="https://example.com/favicon.png"
      type="url"
    />
    <p className="text-xs text-muted-foreground mt-1">
      输入Favicon图标的完整URL地址，留空则使用默认图标
    </p>
  </div>

  {/* 预览 */}
  {faviconPreview && (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <img
        src={faviconPreview}
        alt="Favicon预览"
        className="w-8 h-8"
        onError={() => {
          toast.error('图标加载失败', {
            description: '请检查URL是否正确',
          });
        }}
      />
      <span className="text-sm text-muted-foreground">
        预览效果（实际大小：16x16 或 32x32）
      </span>
    </div>
  )}
</div>
```

#### 5. 创建动态Favicon Hook

创建 `src/hooks/useFavicon.ts`：

```typescript
import { useEffect } from 'react';
import { getSiteSettings } from '@/db/api';

/**
 * 动态更新浏览器标签页图标的 Hook
 */
export function useFavicon() {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const settings = await getSiteSettings();
        
        if (settings?.favicon_url) {
          // 查找现有的favicon link标签
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          
          if (!link) {
            // 如果不存在，创建新的
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          
          // 更新href，添加时间戳防止缓存
          link.href = `${settings.favicon_url}?t=${Date.now()}`;
        }
      } catch (error) {
        console.error('更新Favicon失败:', error);
      }
    };

    updateFavicon();
  }, []);
}
```

#### 6. 在App.tsx中使用

修改 `src/App.tsx`：

```tsx
import { useFavicon } from '@/hooks/useFavicon';

export default function App() {
  useBrowserTitle();
  useFavicon(); // 添加这行

  return (
    // ... 现有代码
  );
}
```

---

## ⚡ 方案2：直接使用外部URL（最简单）

### 优点
- ✅ 最简单快速
- ✅ 无需上传文件
- ✅ 可以使用CDN加速
- ✅ 便于测试

### 实现方法

直接修改 `index.html`，使用外部图片URL：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    
    <!-- 方式1：使用图床URL -->
    <link rel="icon" type="image/png" href="https://i.imgur.com/your-icon.png" />
    
    <!-- 方式2：使用CDN URL -->
    <link rel="icon" type="image/png" href="https://cdn.example.com/favicon.png" />
    
    <!-- 方式3：使用GitHub Raw URL -->
    <link rel="icon" type="image/png" href="https://raw.githubusercontent.com/user/repo/main/favicon.png" />
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>合规通 Case Wiki</title>
  </head>
  <body class="dark:bg-gray-900">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 推荐的图床服务

1. **ImgBB** (https://imgbb.com/)
   - 免费，支持直链
   - 上传后获取直接URL

2. **Imgur** (https://imgur.com/)
   - 老牌图床，稳定可靠
   - 全球CDN加速

3. **SM.MS** (https://sm.ms/)
   - 国内访问快速
   - 免费额度充足

4. **jsDelivr + GitHub**
   - 将图标上传到GitHub仓库
   - 使用jsDelivr CDN加速
   - URL格式：`https://cdn.jsdelivr.net/gh/用户名/仓库名@分支/文件路径`

---

## 🎨 方案3：使用Data URL（Base64编码）

### 优点
- ✅ 减少HTTP请求
- ✅ 图标立即可用，无需加载
- ✅ 不依赖外部服务

### 缺点
- ❌ HTML文件变大
- ❌ 不利于缓存
- ❌ 仅适合小图标

### 实现方法

#### 1. 将图片转换为Base64

**在线工具：**
- https://www.base64-image.de/
- https://base64.guru/converter/encode/image

**命令行工具：**
```bash
# Linux/Mac
base64 favicon.png

# 或使用Node.js
node -e "console.log('data:image/png;base64,' + require('fs').readFileSync('favicon.png').toString('base64'))"
```

#### 2. 在HTML中使用

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    
    <!-- 使用Data URL -->
    <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA..." />
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>合规通 Case Wiki</title>
  </head>
  <body class="dark:bg-gray-900">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### 3. 使用SVG Data URL（推荐用于简单图标）

```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231E4A8C'/><text x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>合</text></svg>" />
```

---

## 🔄 方案4：通过JavaScript动态修改

### 优点
- ✅ 最灵活
- ✅ 可以根据条件切换
- ✅ 可以实现动态效果
- ✅ 可以响应用户操作

### 使用场景
- 根据主题切换图标（浅色/深色）
- 根据页面状态切换图标
- 显示通知数量
- 实现动画效果

### 实现方法

#### 1. 基础动态修改

创建 `src/utils/favicon.ts`：

```typescript
/**
 * 动态修改Favicon
 */
export function setFavicon(url: string) {
  // 查找现有的favicon link标签
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  
  if (!link) {
    // 如果不存在，创建新的
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  
  // 更新href，添加时间戳防止缓存
  link.href = `${url}?t=${Date.now()}`;
}

/**
 * 根据主题切换Favicon
 */
export function setFaviconByTheme(theme: 'light' | 'dark') {
  const faviconUrl = theme === 'dark' 
    ? '/favicon-dark.png' 
    : '/favicon-light.png';
  
  setFavicon(faviconUrl);
}

/**
 * 使用SVG动态生成Favicon
 */
export function setFaviconFromSVG(svgContent: string) {
  const svg = encodeURIComponent(svgContent);
  const dataUrl = `data:image/svg+xml,${svg}`;
  setFavicon(dataUrl);
}

/**
 * 在Favicon上显示数字（通知数量）
 */
export function setFaviconWithBadge(count: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;
  
  // 绘制背景（可以先加载原始favicon）
  ctx.fillStyle = '#1E4A8C';
  ctx.fillRect(0, 0, 32, 32);
  
  // 绘制数字
  if (count > 0) {
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.arc(24, 8, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count > 99 ? '99+' : count.toString(), 24, 8);
  }
  
  // 转换为Data URL并设置
  setFavicon(canvas.toDataURL('image/png'));
}
```

#### 2. 在组件中使用

```tsx
import { useEffect } from 'react';
import { setFavicon, setFaviconByTheme, setFaviconWithBadge } from '@/utils/favicon';

// 示例1：根据主题切换
function App() {
  const theme = useTheme();
  
  useEffect(() => {
    setFaviconByTheme(theme);
  }, [theme]);
  
  return <div>...</div>;
}

// 示例2：显示通知数量
function NotificationComponent() {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    setFaviconWithBadge(unreadCount);
  }, [unreadCount]);
  
  return <div>...</div>;
}

// 示例3：使用外部URL
function CustomFavicon() {
  useEffect(() => {
    setFavicon('https://example.com/custom-favicon.png');
  }, []);
  
  return <div>...</div>;
}
```

#### 3. 高级示例：动画Favicon

```typescript
/**
 * 创建动画Favicon（例如加载动画）
 */
export function startFaviconAnimation() {
  const frames = [
    '/favicon-frame1.png',
    '/favicon-frame2.png',
    '/favicon-frame3.png',
    '/favicon-frame4.png',
  ];
  
  let currentFrame = 0;
  
  const interval = setInterval(() => {
    setFavicon(frames[currentFrame]);
    currentFrame = (currentFrame + 1) % frames.length;
  }, 200);
  
  // 返回停止函数
  return () => {
    clearInterval(interval);
    setFavicon('/favicon.png'); // 恢复默认
  };
}

// 使用示例
function LoadingComponent() {
  useEffect(() => {
    const stopAnimation = startFaviconAnimation();
    
    // 组件卸载时停止动画
    return stopAnimation;
  }, []);
  
  return <div>Loading...</div>;
}
```

---

## 📐 方案5：使用SVG代码直接嵌入

### 优点
- ✅ 矢量图，任意缩放不失真
- ✅ 文件小，加载快
- ✅ 可以用CSS控制样式
- ✅ 支持动画效果

### 实现方法

#### 1. 创建SVG文件

创建 `public/favicon.svg`：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- 背景 -->
  <rect width="100" height="100" fill="#1E4A8C" rx="10"/>
  
  <!-- 文字 -->
  <text 
    x="50" 
    y="70" 
    font-size="60" 
    text-anchor="middle" 
    fill="white" 
    font-family="Arial, sans-serif" 
    font-weight="bold">
    合
  </text>
</svg>
```

#### 2. 在HTML中引用

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

#### 3. 使用Data URL（无需文件）

```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231E4A8C' rx='10'/><text x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>合</text></svg>" />
```

#### 4. 响应主题的SVG Favicon

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <style>
    @media (prefers-color-scheme: dark) {
      .bg { fill: #1E4A8C; }
      .text { fill: white; }
    }
    @media (prefers-color-scheme: light) {
      .bg { fill: white; }
      .text { fill: #1E4A8C; }
    }
  </style>
  
  <rect class="bg" width="100" height="100" rx="10"/>
  <text class="text" x="50" y="70" font-size="60" text-anchor="middle" font-family="Arial" font-weight="bold">合</text>
</svg>
```

---

## 🎯 推荐方案组合

### 场景1：需要经常更换（推荐）

**使用方案1（管理后台配置）**

优势：
- 用户友好，无需技术知识
- 可视化操作
- 统一管理

实施步骤：
1. 扩展数据库表添加 `favicon_url` 字段
2. 在管理后台添加配置界面
3. 创建 `useFavicon` Hook
4. 在 `App.tsx` 中使用

---

### 场景2：快速测试或临时使用

**使用方案2（外部URL）**

优势：
- 最快速
- 无需修改代码
- 便于测试

实施步骤：
1. 将图标上传到图床
2. 修改 `index.html` 中的 `href`
3. 清除浏览器缓存测试

---

### 场景3：需要动态效果

**使用方案4（JavaScript动态修改）**

优势：
- 最灵活
- 可以实现各种动态效果
- 可以响应用户操作

实施步骤：
1. 创建 `src/utils/favicon.ts` 工具函数
2. 在需要的组件中调用
3. 根据条件动态切换

---

### 场景4：简单图标，追求性能

**使用方案5（SVG代码）**

优势：
- 矢量图，清晰度高
- 文件小，加载快
- 支持主题切换

实施步骤：
1. 创建SVG文件或使用Data URL
2. 在 `index.html` 中引用
3. 可选：添加CSS实现主题响应

---

## 📊 完整实现示例

### 示例：管理后台配置Favicon（完整代码）

#### 1. 数据库Migration

创建 `supabase/migrations/00024_add_favicon_url.sql`：

```sql
/*
# 添加Favicon URL配置

1. 修改表结构
   - 在 site_settings 表添加 favicon_url 字段

2. 说明
   - 支持通过管理后台配置Favicon URL
   - 可以使用外部图床URL或本地文件路径
*/

-- 添加favicon_url字段
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS favicon_url text;

-- 添加注释
COMMENT ON COLUMN site_settings.favicon_url IS '浏览器标签页图标URL';
```

#### 2. 类型定义

修改 `src/types/types.ts`：

```typescript
export interface SiteSettings {
  id: string;
  site_title: string;
  site_subtitle: string | null;
  browser_title: string | null;
  logo_url: string | null;
  favicon_url: string | null; // 新增
  created_at: string;
  updated_at: string;
}
```

#### 3. Favicon Hook

创建 `src/hooks/useFavicon.ts`：

```typescript
import { useEffect } from 'react';
import { getSiteSettings } from '@/db/api';

/**
 * 动态更新浏览器标签页图标的 Hook
 * 从数据库读取配置的Favicon URL，如果没有配置则使用默认图标
 */
export function useFavicon() {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const settings = await getSiteSettings();
        
        if (settings?.favicon_url) {
          // 查找现有的favicon link标签
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          
          if (!link) {
            // 如果不存在，创建新的
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          
          // 更新href，添加时间戳防止缓存
          link.href = `${settings.favicon_url}?t=${Date.now()}`;
          
          console.log('Favicon已更新:', settings.favicon_url);
        } else {
          console.log('使用默认Favicon');
        }
      } catch (error) {
        console.error('更新Favicon失败:', error);
      }
    };

    updateFavicon();
  }, []);
}
```

#### 4. 在App.tsx中使用

修改 `src/App.tsx`：

```typescript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ModuleProvider } from '@/contexts/ModuleContext';
import { useBrowserTitle } from '@/hooks/useBrowserTitle';
import { useFavicon } from '@/hooks/useFavicon'; // 新增
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import routes from './routes';

export default function App() {
  // 动态更新浏览器标题
  useBrowserTitle();
  
  // 动态更新Favicon
  useFavicon(); // 新增

  return (
    <Router>
      <ModuleProvider>
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <main className="flex-grow">
            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toaster />
        </div>
      </ModuleProvider>
    </Router>
  );
}
```

#### 5. 管理后台UI（部分代码）

在 `src/pages/admin/SiteSettingsPage.tsx` 中添加：

```tsx
// 在现有状态中添加
const [faviconUrl, setFaviconUrl] = useState('');
const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

// 在loadSettings中添加
const loadSettings = async () => {
  try {
    setLoading(true);
    const data = await getSiteSettings();
    if (data) {
      setSettings(data);
      setSiteTitle(data.site_title);
      setSiteSubtitle(data.site_subtitle || '');
      setBrowserTitle(data.browser_title || '');
      setLogoUrl(data.logo_url);
      setLogoPreview(data.logo_url);
      setLogoUrlInput(data.logo_url || '');
      setFaviconUrl(data.favicon_url || ''); // 新增
      setFaviconPreview(data.favicon_url); // 新增
    }
  } catch (error: any) {
    toast.error('加载失败', {
      description: error.message,
    });
  } finally {
    setLoading(false);
  }
};

// 在handleSave中添加
const handleSave = async () => {
  if (!settings) return;

  // ... 现有验证代码

  try {
    setSaving(true);

    // ... 现有Logo处理代码

    // 更新配置
    await updateSiteSettings(settings.id, {
      site_title: siteTitle.trim(),
      site_subtitle: siteSubtitle.trim() || null,
      browser_title: browserTitle.trim() || null,
      logo_url: finalLogoUrl,
      favicon_url: faviconUrl.trim() || null, // 新增
    });

    toast.success('保存成功', {
      description: '网站信息已更新',
    });

    // 重新加载配置
    await loadSettings();
    setLogoFile(null);
    setUseUrlInput(false);
  } catch (error: any) {
    toast.error('保存失败', {
      description: error.message,
    });
  } finally {
    setSaving(false);
  }
};

// 在JSX中添加（放在Logo配置之后）
<div className="space-y-4">
  <div>
    <Label className="flex items-center gap-2 mb-2">
      浏览器标签页图标（Favicon）
    </Label>
    <p className="text-xs text-muted-foreground mb-4">
      显示在浏览器标签页、书签栏的小图标
    </p>
  </div>

  <div className="space-y-2">
    <Label htmlFor="favicon-url">Favicon图标URL</Label>
    <Input
      id="favicon-url"
      value={faviconUrl}
      onChange={(e) => {
        setFaviconUrl(e.target.value);
        setFaviconPreview(e.target.value || null);
      }}
      placeholder="https://example.com/favicon.png"
      type="url"
    />
    <p className="text-xs text-muted-foreground">
      输入Favicon图标的完整URL地址，留空则使用默认图标（/favicon.png）
    </p>
  </div>

  {/* 预览 */}
  {faviconPreview && (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
      <div className="w-8 h-8 flex items-center justify-center border border-border rounded bg-background">
        <img
          src={faviconPreview}
          alt="Favicon预览"
          className="w-6 h-6"
          onError={() => {
            toast.error('图标加载失败', {
              description: '请检查URL是否正确',
            });
          }}
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">预览效果</p>
        <p className="text-xs text-muted-foreground">
          实际显示尺寸：16x16 或 32x32 像素
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setFaviconUrl('');
          setFaviconPreview(null);
        }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )}

  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="text-xs">
      <div className="space-y-1">
        <p><strong>推荐尺寸：</strong>16x16、32x32、48x48 像素</p>
        <p><strong>推荐格式：</strong>PNG（透明背景）、ICO、SVG</p>
        <p><strong>推荐图床：</strong></p>
        <p>• <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ImgBB</a> - 免费图床，支持直链</p>
        <p>• <a href="https://imgur.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Imgur</a> - 老牌图床，稳定可靠</p>
      </div>
    </AlertDescription>
  </Alert>
</div>
```

---

## 🧪 测试验证

### 1. 测试外部URL方式

```bash
# 1. 修改index.html
# 将href改为外部URL

# 2. 启动开发服务器
pnpm run dev

# 3. 访问网站
# http://localhost:5173

# 4. 检查浏览器标签页图标
# 应该显示外部URL的图标
```

### 2. 测试管理后台配置

```bash
# 1. 应用Migration
# 添加favicon_url字段

# 2. 启动开发服务器
pnpm run dev

# 3. 登录管理后台
# 进入"网站信息配置"

# 4. 输入Favicon URL
# 例如：https://i.imgur.com/xxx.png

# 5. 保存并刷新页面
# 检查标签页图标是否更新
```

### 3. 测试动态修改

```javascript
// 在浏览器控制台执行

// 测试1：修改为外部URL
let link = document.querySelector("link[rel*='icon']");
link.href = "https://www.google.com/favicon.ico";

// 测试2：使用Data URL
link.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FF6B35'/></svg>";

// 测试3：恢复默认
link.href = "/favicon.png";
```

---

## ⚠️ 注意事项

### 1. 浏览器缓存

Favicon会被浏览器强缓存，修改后需要：
- 清除浏览器缓存
- 使用隐私/无痕模式测试
- 在URL后添加时间戳：`?t=${Date.now()}`

### 2. 跨域问题

使用外部URL时，某些浏览器可能有跨域限制：
- 确保图片服务器支持CORS
- 或使用Data URL方式
- 或将图片下载到本地

### 3. 文件大小

- Favicon应该尽可能小（< 10KB）
- 使用Data URL时注意HTML文件大小
- 考虑使用SVG格式

### 4. 兼容性

不同浏览器对Favicon的支持不同：
- 提供多种格式（ICO、PNG、SVG）
- 提供多种尺寸（16x16、32x32、48x48）
- 测试主流浏览器

---

## 📚 总结

### 最佳实践建议

1. **开发阶段**
   - 使用方案2（外部URL）快速测试
   - 使用方案4（JavaScript）实现动态效果

2. **生产环境**
   - 使用方案1（管理后台配置）便于维护
   - 结合方案5（SVG）提供高质量图标

3. **性能优化**
   - 小图标使用方案3（Data URL）
   - 大图标使用CDN加速

4. **用户体验**
   - 提供多种尺寸适配不同设备
   - 支持浅色/深色主题切换
   - 考虑添加动态效果（如通知数量）

---

**文档版本：** v1.0  
**更新时间：** 2025-12-04  
**适用项目：** 合规通 Case Wiki

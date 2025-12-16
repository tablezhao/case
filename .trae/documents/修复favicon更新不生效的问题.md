## 问题分析

当用户在网站基本信息页面更新favicon时，数据被成功保存到数据库中，但是网站的favicon实际并未更新成新的。

### 根本原因
- 目前应用中的favicon是在`index.html`中硬编码的：`<link rel="icon" type="image/svg+xml" href="/favicon.png" />`
- 虽然数据库中保存了新的`favicon_url`，但是应用没有动态更新HTML中的favicon链接
- `useBrowserTitle` hook只更新了页面标题，没有更新favicon

## 解决方案

修改现有的`useBrowserTitle` hook，使其同时处理favicon的动态更新，在应用启动时获取site settings，并更新favicon。

## 实现步骤

1. **修改`useBrowserTitle` hook**：在`src/hooks/useBrowserTitle.ts`中添加更新favicon的逻辑
2. **添加favicon更新逻辑**：在hook中，获取site settings，如果存在favicon_url，则更新页面的favicon
3. **确保favicon更新后重新执行**：hook会在应用启动时执行，并在favicon更新后通过页面刷新或重新获取数据来更新

## 代码修改

```typescript
// src/hooks/useBrowserTitle.ts
import { useEffect } from 'react';
import { getSiteSettings } from '@/db/api';

/**
 * 动态更新浏览器标签标题和favicon的 Hook
 * 从数据库读取配置的浏览器标题和favicon，如果没有配置则使用默认值
 */
export function useBrowserTitle() {
  useEffect(() => {
    const updateBrowserMeta = async () => {
      try {
        const settings = await getSiteSettings();
        
        // 更新浏览器标题
        if (settings?.browser_title) {
          document.title = settings.browser_title;
        } else {
          document.title = '合规通 Case Wiki';
        }
        
        // 更新favicon
        const faviconLink = document.querySelector('link[rel="icon"]');
        if (settings?.favicon_url) {
          if (faviconLink) {
            faviconLink.href = settings.favicon_url;
          } else {
            const newFaviconLink = document.createElement('link');
            newFaviconLink.rel = 'icon';
            newFaviconLink.href = settings.favicon_url;
            document.head.appendChild(newFaviconLink);
          }
        }
      } catch (error) {
        console.error('获取浏览器配置失败:', error);
        // 出错时使用默认值
        document.title = '合规通 Case Wiki';
      }
    };

    updateBrowserMeta();
  }, []);
}
```

## 预期效果

- 当用户在网站基本信息页面更新favicon后，页面会自动刷新或重新获取数据
- `useBrowserTitle` hook会重新执行，获取最新的site settings
- 如果存在新的favicon_url，hook会更新HTML中的favicon链接
- 浏览器会自动加载新的favicon，用户可以看到更新后的favicon

## 额外考虑

- 可以考虑添加缓存机制，避免每次页面加载都请求site settings
- 可以考虑添加WebSocket或其他实时更新机制，在favicon更新后立即通知前端
- 可以考虑在favicon更新后，使用`toast`通知用户favicon已更新

这个解决方案简单高效，不需要修改大量代码，只需要修改现有的hook即可实现favicon的动态更新。
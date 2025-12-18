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

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
        
        document.title = settings?.browser_title?.trim() || '合规通 Case Wiki';
      } catch (error) {
        console.error('获取浏览器配置失败:', error);
        document.title = '合规通 Case Wiki';
      }
    };

    updateBrowserMeta();
  }, []);
}

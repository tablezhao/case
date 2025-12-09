import { useEffect } from 'react';
import { getSiteSettings } from '@/db/api';

/**
 * 动态更新浏览器标签标题的 Hook
 * 从数据库读取配置的浏览器标题，如果没有配置则使用默认标题
 */
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
        // 出错时使用默认标题
        document.title = '合规通 Case Wiki';
      }
    };

    updateTitle();
  }, []);
}

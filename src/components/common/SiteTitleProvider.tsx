import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSiteSettings } from '@/db/api';
import type { SiteSettings } from '@/types/types';

interface SiteTitleContextType {
  siteSettings: SiteSettings | null;
  loading: boolean;
  getBrowserTitle: (customTitle?: string) => string;
}

const SiteTitleContext = createContext<SiteTitleContextType | undefined>(undefined);

export const useSiteTitle = () => {
  const context = useContext(SiteTitleContext);
  if (context === undefined) {
    throw new Error('useSiteTitle must be used within a SiteTitleProvider');
  }
  return context;
};

interface SiteTitleProviderProps {
  children: ReactNode;
}

export const SiteTitleProvider: React.FC<SiteTitleProviderProps> = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const data = await getSiteSettings();
        setSiteSettings(data);
      } catch (error) {
        console.error('加载网站配置失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSiteSettings();
  }, []);

  // 获取浏览器标题的方法
  const getBrowserTitle = (customTitle?: string): string => {
    if (customTitle) {
      // 如果提供了自定义标题，则与网站标题组合
      const siteTitle = siteSettings?.browser_title || siteSettings?.site_title || '合规通';
      return `${customTitle} - ${siteTitle}`;
    }
    // 如果没有自定义标题，则使用网站配置的标题
    return siteSettings?.browser_title || siteSettings?.site_title || '合规通';
  };

  const value: SiteTitleContextType = {
    siteSettings,
    loading,
    getBrowserTitle,
  };

  return (
    <SiteTitleContext.Provider value={value}>
      {children}
    </SiteTitleContext.Provider>
  );
};

import React from 'react';
import { HelmetProvider, Helmet } from "react-helmet-async";
import React from 'react';
import { HelmetProvider, Helmet } from "react-helmet-async";
import { useSiteTitle } from './SiteTitleProvider';
import { useEffect, useState } from "react";
import { getSiteSettings } from "@/db/api";
import type { SiteSettings } from "@/types/types";

interface PageMetaProps {
  title?: string;
  description?: string;
}

// 页面级元信息组件，用于设置特定页面的标题和描述
export const PageMeta: React.FC<PageMetaProps> = ({ 
  title, 
  description = '监管合规案例与资讯平台'
}) => {
  const { getBrowserTitle } = useSiteTitle();
  const browserTitle = title ? getBrowserTitle(title) : getBrowserTitle();
  
  return (
    <Helmet>
      <title>{browserTitle}</title>
      <meta name="description" content={description} />
    </Helmet>
  );
};

// 空的PageMeta组件，用于在不提供自定义标题时使用
export const EmptyPageMeta: React.FC = () => {
  const { getBrowserTitle } = useSiteTitle();
  
  return (
    <Helmet>
      <title>{getBrowserTitle()}</title>
    </Helmet>
  );
};

// 全局应用包装组件，用于设置默认的站点元信息
export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  
  useEffect(() => {
    // 获取网站设置数据
    const fetchSiteSettings = async () => {
      try {
        const data = await getSiteSettings();
        if (data) {
          setSiteSettings(data);
        }
      } catch (error) {
        console.error("获取网站设置失败:", error);
      }
    };
    
    fetchSiteSettings();
  }, []);
  
  return (
    <HelmetProvider>
      <Helmet>
        <title>{siteSettings?.browser_title || siteSettings?.site_title || "合规通"}</title>
        <meta name="description" content={siteSettings?.site_subtitle || "App监管案例查询平台"} />
      </Helmet>
      {children}
    </HelmetProvider>
  );
};

export default PageMeta;

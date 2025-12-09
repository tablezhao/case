import { HelmetProvider, Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { getSiteSettings } from "@/db/api";
import type { SiteSettings } from "@/types/types";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  
  useEffect(() => {
    // 获取网站设置数据
    const fetchSiteSettings = async () => {
      try {
        const data = await getSiteSettings();
        if (data && data.site_title) {
          setSiteSettings(data);
          // 设置页面标题
          document.title = data.site_title;
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
        <title>{siteSettings?.site_title || "合规通"}</title>
        <meta name="description" content={siteSettings?.site_subtitle || "App监管案例查询平台"} />
      </Helmet>
      {children}
    </HelmetProvider>
  );
};

export default PageMeta;

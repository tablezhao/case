import React from 'react';
import { HelmetProvider, Helmet } from "react-helmet-async";
import { useSiteTitle } from './SiteTitleProvider';

interface PageMetaProps {
  title?: string;
  description?: string;
}

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

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;

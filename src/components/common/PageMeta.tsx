import { useEffect, useState } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { getSiteSettings } from '@/db/api';

const DEFAULT_BROWSER_TITLE = '合规通 Case Wiki';

function GlobalMeta() {
  const [browserTitle, setBrowserTitle] = useState(DEFAULT_BROWSER_TITLE);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const settings = await getSiteSettings();
        if (cancelled) return;

        const title = settings?.browser_title?.trim();
        setBrowserTitle(title ? title : DEFAULT_BROWSER_TITLE);
        setFaviconUrl(settings?.favicon_url ?? null);
      } catch {
        if (cancelled) return;
        setBrowserTitle(DEFAULT_BROWSER_TITLE);
        setFaviconUrl(null);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Helmet>
      <title>{browserTitle}</title>
      {faviconUrl ? <link rel="icon" href={faviconUrl} /> : null}
    </Helmet>
  );
}

const PageMeta = (props: { title?: string; description?: string }) => (
  <Helmet>
    {props.description ? <meta name="description" content={props.description} /> : null}
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <GlobalMeta />
    {children}
  </HelmetProvider>
);

export default PageMeta;

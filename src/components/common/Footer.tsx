import { Link } from 'react-router-dom';
import { Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFooterSettings } from '@/db/api';
import type { FooterSettings } from '@/types/types';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [settings, setSettings] = useState<FooterSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getFooterSettings();
      setSettings(data);
    } catch (error) {
      console.error('加载页脚配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (section: string) => {
    return settings.find((s) => s.section === section);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: '提示',
        description: '请输入邮箱地址',
        variant: 'destructive',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: '提示',
        description: '请输入有效的邮箱地址',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '订阅成功',
      description: '感谢您的订阅，我们会定期发送最新资讯',
    });
    setEmail('');
  };

  if (loading) {
    return null;
  }

  const aboutSetting = getSetting('about');
  const navigationSetting = getSetting('navigation');
  const friendlyLinksSetting = getSetting('friendly_links');
  const socialMediaSetting = getSetting('social_media');
  const newsletterSetting = getSetting('newsletter');
  const copyrightSetting = getSetting('copyright');
  const filingSetting = getSetting('filing');
  const disclaimerSetting = getSetting('disclaimer');

  return (
    <footer className="bg-gradient-to-b from-background to-muted border-t">
      <div className="container mx-auto px-4 py-12">
        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-8">
          {/* 关于我们 */}
          {aboutSetting && (
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary">{aboutSetting.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {aboutSetting.content.description}
              </p>
              {aboutSetting.content.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a
                    href={`mailto:${aboutSetting.content.email}`}
                    className="hover:text-primary transition-colors leading-none"
                  >
                    {aboutSetting.content.email}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 快速导航 */}
          {navigationSetting && (
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary">{navigationSetting.title}</h3>
              <ul className="space-y-2">
                {navigationSetting.content.links?.map((link: any) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* 社交媒体 */}
              {socialMediaSetting && socialMediaSetting.content.platforms && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-3 text-foreground">关注我们</h4>
                  <div className="flex gap-3">
                    {socialMediaSetting.content.platforms.map((social: any) => (
                      <div
                        key={social.name}
                        className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                        title={social.name}
                      >
                        <span className="text-xs font-medium">{social.icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 友情链接 */}
          {friendlyLinksSetting && (
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary">{friendlyLinksSetting.title}</h3>
              <ul className="space-y-2">
                {friendlyLinksSetting.content.links?.map((link: any) => (
                  <li key={link.name}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      {link.name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Newsletter订阅 */}
          {newsletterSetting && newsletterSetting.content.enabled && (
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary">{newsletterSetting.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {newsletterSetting.content.description}
              </p>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <Input
                  type="email"
                  placeholder="输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                />
                <Button type="submit" className="w-full" size="sm">
                  订阅
                </Button>
              </form>
              {newsletterSetting.content.privacy_note && (
                <p className="text-xs text-muted-foreground mt-2">
                  {newsletterSetting.content.privacy_note}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="border-t my-8"></div>

        {/* 底部信息 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          {/* 版权信息 */}
          {copyrightSetting && (
            <div className="text-center md:text-left">
              <p>
                © {copyrightSetting.content.show_year ? currentYear : ''}{' '}
                {copyrightSetting.content.company_name}
              </p>
            </div>
          )}

          {/* 备案信息 */}
          {filingSetting && (
            <div className="flex flex-wrap justify-center md:justify-end gap-4 text-xs">
              {filingSetting.content.icp && (
                <a
                  href={filingSetting.content.icp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {filingSetting.content.icp.number}
                </a>
              )}
              {filingSetting.content.police && (
                <a
                  href={filingSetting.content.police.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <span>{filingSetting.content.police.number}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* 免责声明 */}
        {disclaimerSetting && disclaimerSetting.content.text && (
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground max-w-4xl mx-auto">
              {disclaimerSetting.content.text}
            </p>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;

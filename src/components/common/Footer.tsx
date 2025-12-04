import { Link } from 'react-router-dom';
import { Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  // 快速导航链接
  const quickLinks = [
    { name: '首页', path: '/' },
    { name: '案例查询', path: '/cases' },
    { name: '监管资讯', path: '/news' },
  ];

  // 友情链接
  const friendlyLinks = [
    { name: '工业和信息化部', url: 'https://www.miit.gov.cn' },
    { name: '国家互联网信息办公室', url: 'https://www.cac.gov.cn' },
    { name: '公安部', url: 'https://www.mps.gov.cn' },
    { name: '市场监管总局', url: 'https://www.samr.gov.cn' },
  ];

  // 社交媒体（示例）
  const socialMedia = [
    { name: '微信公众号', icon: '微信', qrcode: true },
    { name: '官方微博', icon: '微博', url: '#' },
  ];

  // Newsletter订阅
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
    
    // 简单的邮箱验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: '提示',
        description: '请输入有效的邮箱地址',
        variant: 'destructive',
      });
      return;
    }

    // 这里可以添加实际的订阅逻辑
    toast({
      title: '订阅成功',
      description: '感谢您的订阅，我们会定期发送最新资讯',
    });
    setEmail('');
  };

  return (
    <footer className="bg-gradient-to-b from-background to-muted border-t">
      <div className="container mx-auto px-4 py-12">
        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-8">
          {/* 关于我们 */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary">关于合规通</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              合规通致力于打造信息透明、查询便捷的App监管案例平台，
              汇集各级网络监管部门发布的违规案例和监管资讯，
              助力企业合规发展，保护用户权益。
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a href="mailto:contact@compliance.gov.cn" className="hover:text-primary transition-colors">
                contact@compliance.gov.cn
              </a>
            </div>
          </div>

          {/* 快速导航 */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary">快速导航</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  管理后台
                </Link>
              </li>
            </ul>

            {/* 社交媒体 */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-foreground">关注我们</h4>
              <div className="flex gap-3">
                {socialMedia.map((social) => (
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
          </div>

          {/* 友情链接 */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary">友情链接</h3>
            <ul className="space-y-2">
              {friendlyLinks.map((link) => (
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

          {/* Newsletter订阅 */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary">订阅资讯</h3>
            <p className="text-sm text-muted-foreground mb-4">
              订阅我们的邮件列表，获取最新监管动态和案例分析
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
            <p className="text-xs text-muted-foreground mt-2">
              我们尊重您的隐私，不会向第三方分享您的信息
            </p>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="border-t my-8"></div>

        {/* 底部信息 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          {/* 版权信息 */}
          <div className="text-center md:text-left">
            <p>© {currentYear} 合规通</p>
          </div>

          {/* 备案信息（示例） */}
          <div className="flex flex-wrap justify-center md:justify-end gap-4 text-xs">
            <a
              href="https://beian.miit.gov.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              京ICP备XXXXXXXX号
            </a>
            <a
              href="http://www.beian.gov.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <span>京公网安备XXXXXXXXXXXXX号</span>
            </a>
          </div>
        </div>

        {/* 免责声明 */}
        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground max-w-4xl mx-auto">
            本平台所展示的监管案例和资讯均来源于各级监管部门官方网站，仅供参考学习使用。
            如有疑问或需要了解详细信息，请访问相关监管部门官方网站或联系相关部门。
            本平台不对信息的准确性、完整性、及时性承担任何法律责任。
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

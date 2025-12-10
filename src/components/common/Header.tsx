import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Settings, User, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/db/supabase';
import { getCurrentProfile, getSiteSettings, getVisibleNavigationOrder } from '@/db/api';
import type { Profile, SiteSettings, NavigationOrder } from '@/types/types';
import { toast } from 'sonner';
import { useModules } from '@/contexts/ModuleContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavigationOrder[]>([]);
  const { isModuleEnabled } = useModules();

  useEffect(() => {
    loadProfile();
    loadSiteSettings();
    loadNavigationOrder();
    
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getCurrentProfile();
      setProfile(data);
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  const loadSiteSettings = async () => {
    try {
      const data = await getSiteSettings();
      setSiteSettings(data);
    } catch (error) {
      console.error('加载网站配置失败:', error);
    }
  };

  const loadNavigationOrder = async () => {
    try {
      const data = await getVisibleNavigationOrder();
      // 根据模块设置进一步过滤
      const filteredData = data.filter(item => {
        // 首页始终显示
        if (item.module_key === 'home') return true;
        // 其他模块根据模块设置决定
        return isModuleEnabled(item.module_key);
      });
      setNavigationItems(filteredData);
    } catch (error) {
      console.error('加载导航配置失败:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setMobileMenuOpen(false);
      toast.success('已退出登录');
      navigate('/');
    } catch (error) {
      console.error('退出登录失败:', error);
      toast.error('退出登录失败');
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 min-h-[44px]">
              {siteSettings?.logo_url ? (
                <img 
                  src={siteSettings.logo_url} 
                  alt={siteSettings.site_title}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <span className="text-xl font-bold text-primary">
                {siteSettings?.site_title || '合规通'}
              </span>
            </Link>
          </div>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => (
              <Link
                key={item.module_key}
                to={item.route_path}
                className={`px-3 py-2 min-h-[44px] flex items-center text-sm font-medium rounded transition-colors ${
                  location.pathname === item.route_path
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:text-primary hover:bg-muted'
                }`}
              >
                {item.module_name}
              </Link>
            ))}

            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 min-h-[44px]">
                    <User className="w-4 h-4" />
                    <span>{profile.username || '用户'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.role === 'admin' ? '管理员' : '普通用户'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profile.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer min-h-[44px] flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        管理后台
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive min-h-[44px] flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild className="min-h-[44px]">
                <Link to="/login">登录</Link>
              </Button>
            )}
          </div>

          {/* 移动端菜单 */}
          <div className="md:hidden flex items-center gap-2">
            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 min-h-[44px] min-w-[44px]">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.role === 'admin' ? '管理员' : '普通用户'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profile.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer min-h-[44px] flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        管理后台
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive min-h-[44px] flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild className="min-h-[44px]">
                <Link to="/login">登录</Link>
              </Button>
            )}

            {/* 汉堡菜单 */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-2">
                  <Menu className="w-6 h-6" />
                  <span className="sr-only">打开菜单</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {siteSettings?.logo_url ? (
                      <img 
                        src={siteSettings.logo_url} 
                        alt={siteSettings.site_title}
                        className="h-5 w-auto object-contain"
                      />
                    ) : (
                      <Shield className="w-5 h-5 text-primary" />
                    )}
                    <span className="text-primary">
                      {siteSettings?.site_title || '合规通'}
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.module_key}
                      to={item.route_path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-3 min-h-[44px] flex items-center text-base font-medium rounded-lg transition-colors ${
                        location.pathname === item.route_path
                          ? 'text-primary bg-primary/10'
                          : 'text-foreground hover:text-primary hover:bg-muted'
                      }`}
                    >
                      {item.module_name}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}

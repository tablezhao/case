import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/db/supabase';
import { getCurrentProfile } from '@/db/api';
import type { Profile } from '@/types/types';
import { toast } from 'sonner';
import routes from '@/routes';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigation = routes.filter((route) => route.visible !== false);

  useEffect(() => {
    loadProfile();
    
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      toast.success('已退出登录');
      navigate('/');
    } catch (error) {
      console.error('退出登录失败:', error);
      toast.error('退出登录失败');
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">合规通</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                  location.pathname === item.path
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:text-primary hover:bg-muted'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
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
                      <Link to="/admin" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        管理后台
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild>
                <Link to="/login">登录</Link>
              </Button>
            )}
          </div>

          {/* 移动端菜单 */}
          <div className="md:hidden flex items-center">
            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
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
                  {navigation.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="cursor-pointer">
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {profile.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        管理后台
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild>
                <Link to="/login">登录</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

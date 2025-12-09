import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Newspaper, Users, Building2, Sparkles, Layout, Settings, Home, Globe } from 'lucide-react';

export default function AdminPage() {
  const menuItems = [
    {
      title: '智能导入',
      description: 'AI智能解析网页案例',
      icon: Sparkles,
      link: '/admin/smart-import',
      color: 'text-primary',
    },
    {
      title: '案例管理',
      description: '管理监管案例数据',
      icon: FileText,
      link: '/admin/cases',
      color: 'text-secondary',
    },
    {
      title: '资讯管理',
      description: '管理监管资讯内容',
      icon: Newspaper,
      link: '/admin/news',
      color: 'text-chart-3',
    },
    {
      title: '部门与平台',
      description: '管理监管部门和应用平台',
      icon: Building2,
      link: '/admin/departments',
      color: 'text-chart-4',
    },
    {
      title: '用户管理',
      description: '管理用户和权限',
      icon: Users,
      link: '/admin/users',
      color: 'text-chart-5',
    },
    {
      title: '首页配置',
      description: '控制首页模块显示',
      icon: Home,
      link: '/admin/home-config',
      color: 'text-blue-500',
    },
    {
      title: '模块设置',
      description: '控制导航模块可见性',
      icon: Settings,
      link: '/admin/module-settings',
      color: 'text-orange-500',
    },
    {
      title: '页脚配置',
      description: '管理网站页脚内容',
      icon: Layout,
      link: '/admin/footer-settings',
      color: 'text-chart-1',
    },
    {
      title: '网站基本信息',
      description: '配置网站标题和Logo',
      icon: Globe,
      link: '/admin/site-settings',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">管理后台</h1>
        <p className="text-muted-foreground mt-2">欢迎使用合规通管理系统</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
        {menuItems.map((item) => (
          <Link key={item.link} to={item.link}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

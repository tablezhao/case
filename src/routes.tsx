import type { ReactNode } from 'react';
import HomePage from './pages/HomePage';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import DepartmentsPublicPage from './pages/DepartmentsPage';
import TrendAnalysisPage from './pages/TrendAnalysisPage';
import ViolationAnalysisPage from './pages/ViolationAnalysisPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/admin/AdminPage';
import CaseManagePage from './pages/admin/CaseManagePage';
import NewsManagePage from './pages/admin/NewsManagePage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import UsersPage from './pages/admin/UsersPage';
import SmartImportPage from './pages/admin/SmartImportPage';
import FooterSettingsPage from './pages/admin/FooterSettingsPage';
import ModuleSettingsPage from './pages/admin/ModuleSettingsPage';
import HomeConfigPage from './pages/admin/HomeConfigPage';
import SiteSettingsPage from './pages/admin/SiteSettingsPage';
import ProtectedModuleRoute from './components/common/ProtectedModuleRoute';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: <HomePage />,
    visible: true,
  },
  {
    name: '案例查询',
    path: '/cases',
    element: (
      <ProtectedModuleRoute moduleKey="cases">
        <CasesPage />
      </ProtectedModuleRoute>
    ),
    visible: true,
  },
  {
    name: '案例详情',
    path: '/cases/:id',
    element: (
      <ProtectedModuleRoute moduleKey="cases">
        <CaseDetailPage />
      </ProtectedModuleRoute>
    ),
    visible: false,
  },
  {
    name: '监管资讯',
    path: '/news',
    element: (
      <ProtectedModuleRoute moduleKey="news">
        <NewsPage />
      </ProtectedModuleRoute>
    ),
    visible: true,
  },
  {
    name: '资讯详情',
    path: '/news/:id',
    element: (
      <ProtectedModuleRoute moduleKey="news">
        <NewsDetailPage />
      </ProtectedModuleRoute>
    ),
    visible: false,
  },
  {
    name: '监管部门',
    path: '/departments',
    element: (
      <ProtectedModuleRoute moduleKey="departments">
        <DepartmentsPublicPage />
      </ProtectedModuleRoute>
    ),
    visible: true,
  },
  {
    name: '趋势分析',
    path: '/trend-analysis',
    element: (
      <ProtectedModuleRoute moduleKey="trends">
        <TrendAnalysisPage />
      </ProtectedModuleRoute>
    ),
    visible: true,
  },
  {
    name: '问题分析',
    path: '/violation-analysis',
    element: (
      <ProtectedModuleRoute moduleKey="issues">
        <ViolationAnalysisPage />
      </ProtectedModuleRoute>
    ),
    visible: true,
  },
  {
    name: '登录',
    path: '/login',
    element: <LoginPage />,
    visible: false,
  },
  {
    name: '管理后台',
    path: '/admin',
    element: <AdminPage />,
    visible: false,
    requireAuth: true,
    requireAdmin: true,
  },
  {
    name: '案例管理',
    path: '/admin/cases',
    element: <CaseManagePage />,
    visible: false,
    requireAuth: true,
    requireAdmin: true,
  },
  {
    name: '资讯管理',
    path: '/admin/news',
    element: <NewsManagePage />,
    visible: false,
    requireAuth: true,
    requireAdmin: true,
  },
  {
    name: '部门平台管理',
    path: '/admin/departments',
    element: <DepartmentsPage />,
    visible: false,
    requireAuth: true,
    requireAdmin: true,
  },
  {
    name: '用户管理',
    path: '/admin/users',
    element: <UsersPage />,
    visible: false,
    requireAuth: true,
    requireAdmin: true,
  },
  {
    name: '智能导入',
    path: '/admin/smart-import',
    element: <SmartImportPage />,
    visible: false,
    requireAuth: true,
    requireAdmin: true,
  },
  {
    name: '页脚配置',
    path: '/admin/footer-settings',
    element: <FooterSettingsPage />,
    visible: false,
    requireAuth: true,
    requireAdmin: true,
  },
  {
    name: '模块设置',
    path: '/admin/module-settings',
    element: <ModuleSettingsPage />,
    visible: false,
    requireAuth: true,
    requireAdmin: true,
  },
  {
    name: '首页配置',
    path: '/admin/home-config',
    element: <HomeConfigPage />,
    visible: false,
    requireAuth: true,
    requireAdmin: true,
  },
  {
    name: '网站基本信息',
    path: '/admin/site-settings',
    element: <SiteSettingsPage />,
    visible: false,
    requireAuth: true,
    requireAdmin: true,
  },
];

export default routes;

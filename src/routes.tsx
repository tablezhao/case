import type { ReactNode } from 'react';
import HomePage from './pages/HomePage';
import CasesPage from './pages/CasesPage';
import NewsPage from './pages/NewsPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/admin/AdminPage';
import CaseManagePage from './pages/admin/CaseManagePage';
import NewsManagePage from './pages/admin/NewsManagePage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import UsersPage from './pages/admin/UsersPage';

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
    element: <CasesPage />,
    visible: true,
  },
  {
    name: '监管资讯',
    path: '/news',
    element: <NewsPage />,
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
];

export default routes;

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useModules } from '@/contexts/ModuleContext';

interface ProtectedModuleRouteProps {
  children: ReactNode;
  moduleKey: string;
}

export default function ProtectedModuleRoute({ children, moduleKey }: ProtectedModuleRouteProps) {
  const { isModuleEnabled, isLoading } = useModules();

  // 加载中时显示空白或加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 如果模块未启用，重定向到首页
  if (!isModuleEnabled(moduleKey)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

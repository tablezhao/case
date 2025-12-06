import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getEnabledModules } from '@/db/api';

interface ModuleContextType {
  modules: Record<string, boolean>;
  isModuleEnabled: (key: string) => boolean;
  refreshModules: () => Promise<void>;
  isLoading: boolean;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<Record<string, boolean>>({
    cases: true,
    news: true,
    departments: true,
    trends: true,
    issues: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadModules = async () => {
    try {
      setIsLoading(true);
      const enabledModules = await getEnabledModules();
      setModules(enabledModules);
    } catch (error) {
      console.error('加载模块设置失败:', error);
      // 失败时使用默认值（所有模块启用）
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const isModuleEnabled = (key: string): boolean => {
    return modules[key] ?? true; // 默认启用
  };

  const refreshModules = async () => {
    await loadModules();
  };

  return (
    <ModuleContext.Provider value={{ modules, isModuleEnabled, refreshModules, isLoading }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
}

import { useEffect, useState } from 'react';
import { getModuleSettings, updateModuleSetting } from '@/db/api';
import type { ModuleSetting } from '@/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ModuleSettingsPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModuleSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingModule, setUpdatingModule] = useState<string | null>(null);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setIsLoading(true);
      const data = await getModuleSettings();
      setModules(data);
    } catch (error) {
      console.error('加载模块设置失败:', error);
      toast.error('加载模块设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleModule = async (moduleKey: string, currentStatus: boolean) => {
    try {
      setUpdatingModule(moduleKey);
      const newStatus = !currentStatus;
      
      // 更新数据库
      await updateModuleSetting(moduleKey, newStatus);
      
      // 更新本地状态
      setModules(prev => 
        prev.map(m => 
          m.module_key === moduleKey 
            ? { ...m, is_enabled: newStatus } 
            : m
        )
      );
      
      toast.success(
        newStatus 
          ? `已启用「${modules.find(m => m.module_key === moduleKey)?.module_name}」` 
          : `已关闭「${modules.find(m => m.module_key === moduleKey)?.module_name}」`
      );
    } catch (error) {
      console.error('更新模块状态失败:', error);
      toast.error('更新模块状态失败');
    } finally {
      setUpdatingModule(null);
    }
  };

  // 模块图标映射
  const getModuleIcon = (moduleKey: string) => {
    const icons: Record<string, string> = {
      cases: '📋',
      news: '📰',
      departments: '🏛️',
      trends: '📈',
      issues: '🔍',
    };
    return icons[moduleKey] || '📦';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* 页面头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回后台
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8" />
              模块可见性控制
            </h1>
            <p className="text-muted-foreground mt-1">
              管理前台各功能模块的显示状态，关闭的模块将在前台完全隐藏
            </p>
          </div>
        </div>
      </div>

      {/* 说明卡片 */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• <strong>实时生效</strong>：开关状态修改后立即保存并生效，前台用户刷新页面后即可看到变化</p>
          <p>• <strong>完全隐藏</strong>：关闭的模块将在前台导航菜单、首页和相关页面中完全隐藏</p>
          <p>• <strong>访问控制</strong>：用户无法通过直接输入URL访问已关闭的模块页面</p>
          <p>• <strong>布局自适应</strong>：前台界面会自动调整布局，不会出现空白区域</p>
        </CardContent>
      </Card>

      {/* 模块列表 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card 
              key={module.id}
              className={`transition-all ${
                module.is_enabled 
                  ? 'border-primary/30 bg-card' 
                  : 'border-muted bg-muted/30 opacity-75'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getModuleIcon(module.module_key)}</span>
                    <div>
                      <CardTitle className="text-lg">{module.module_name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {module.module_key}
                      </CardDescription>
                    </div>
                  </div>
                  {module.is_enabled ? (
                    <Eye className="w-5 h-5 text-primary" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <Label 
                    htmlFor={`switch-${module.module_key}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {module.is_enabled ? '已启用' : '已关闭'}
                  </Label>
                  <Switch
                    id={`switch-${module.module_key}`}
                    checked={module.is_enabled}
                    onCheckedChange={() => handleToggleModule(module.module_key, module.is_enabled)}
                    disabled={updatingModule === module.module_key}
                  />
                </div>

                {updatingModule === module.module_key && (
                  <div className="text-xs text-center text-muted-foreground">
                    正在保存...
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 底部提示 */}
      <Card className="mt-6 border-muted">
        <CardContent className="py-4">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <span className="text-lg">💡</span>
            <div className="space-y-1">
              <p><strong>提示：</strong></p>
              <p>• 建议在非高峰时段进行模块调整，以减少对用户的影响</p>
              <p>• 关闭模块前请确认该功能确实不需要对外展示</p>
              <p>• 可以随时重新启用已关闭的模块</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

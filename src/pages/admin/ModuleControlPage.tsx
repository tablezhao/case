import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  getNavigationOrder, 
  updateNavigationOrder, 
  resetNavigationOrder 
} from '@/db/api';
import type { NavigationOrder } from '@/types/types';
import PageMeta from '@/components/common/PageMeta';

export default function ModuleControlPage() {
  const navigate = useNavigate();
  
  // 导航排序状态
  const [navModules, setNavModules] = useState<NavigationOrder[]>([]);
  const [editedNavModules, setEditedNavModules] = useState<NavigationOrder[]>([]);
  const [navLoading, setNavLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadNavigationOrder();
  }, []);

  // 加载导航排序
  const loadNavigationOrder = async () => {
    try {
      setNavLoading(true);
      const data = await getNavigationOrder();
      setNavModules(data);
      setEditedNavModules(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error('加载导航排序失败:', error);
      toast.error('加载导航排序失败');
    } finally {
      setNavLoading(false);
    }
  };

  // 处理排序号变更
  const handleSortOrderChange = (id: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) return;

    setEditedNavModules(prev =>
      prev.map(module =>
        module.id === id ? { ...module, sort_order: numValue } : module
      )
    );
  };

  // 处理可见性变更
  const handleNavVisibilityChange = (id: string, checked: boolean) => {
    setEditedNavModules(prev =>
      prev.map(module =>
        module.id === id ? { ...module, is_visible: checked } : module
      )
    );
  };

  // 保存导航排序
  const handleSaveNavOrder = async () => {
    try {
      setSaving(true);

      // 检查是否有重复的排序号
      const sortOrders = editedNavModules.map(m => m.sort_order);
      const uniqueSortOrders = new Set(sortOrders);
      if (sortOrders.length !== uniqueSortOrders.size) {
        toast.error('排序号不能重复，请检查输入');
        return;
      }

      await updateNavigationOrder(editedNavModules);
      setNavModules(JSON.parse(JSON.stringify(editedNavModules)));
      toast.success('导航排序保存成功');
    } catch (error) {
      console.error('保存导航排序失败:', error);
      toast.error('保存导航排序失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置导航排序
  const handleResetNavOrder = async () => {
    try {
      setResetting(true);
      await resetNavigationOrder();
      await loadNavigationOrder();
      toast.success('已恢复默认排序');
    } catch (error) {
      console.error('重置排序失败:', error);
      toast.error('重置排序失败');
    } finally {
      setResetting(false);
    }
  };

  // 取消编辑
  const handleCancelNavEdit = () => {
    setEditedNavModules(JSON.parse(JSON.stringify(navModules)));
    toast.info('已取消修改');
  };

  const hasNavChanges = JSON.stringify(navModules) !== JSON.stringify(editedNavModules);
  const sortedNavModules = [...editedNavModules].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <PageMeta title="导航排序" description="管理导航栏的显示顺序和可见性" />
      
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">导航排序</h1>
            <p className="text-sm text-muted-foreground mt-1">
              管理导航栏的显示顺序和可见性
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 操作按钮 */}
        <Card>
          <CardHeader>
            <CardTitle>导航排序操作</CardTitle>
            <CardDescription>
              保存更改或恢复默认排序
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSaveNavOrder}
                disabled={!hasNavChanges || saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? '保存中...' : '保存排序'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelNavEdit}
                disabled={!hasNavChanges || saving}
              >
                取消修改
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetNavOrder}
                disabled={resetting}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {resetting ? '重置中...' : '恢复默认'}
              </Button>
            </div>
            {hasNavChanges && (
              <p className="text-sm text-amber-600 dark:text-amber-500 mt-3">
                ⚠️ 您有未保存的更改
              </p>
            )}
          </CardContent>
        </Card>

        {/* 导航模块列表 */}
        <Card>
          <CardHeader>
            <CardTitle>导航模块列表</CardTitle>
            <CardDescription>
              当前共有 {navModules.length} 个导航模块
            </CardDescription>
          </CardHeader>
          <CardContent>
            {navLoading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : (
              <div className="space-y-4">
                {sortedNavModules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    {/* 排序号输入 */}
                    <div className="flex flex-col gap-1 w-24">
                      <Label className="text-xs text-muted-foreground">排序号</Label>
                      <Input
                        type="number"
                        min="1"
                        value={module.sort_order}
                        onChange={(e) => handleSortOrderChange(module.id, e.target.value)}
                        className="h-9 text-center"
                      />
                    </div>

                    {/* 模块信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{module.module_name}</span>
                        {!module.is_visible && (
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            已隐藏
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        路由: {module.route_path}
                      </p>
                    </div>

                    {/* 可见性开关 */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">显示</Label>
                      <Switch
                        checked={module.is_visible}
                        onCheckedChange={(checked) => handleNavVisibilityChange(module.id, checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 预览效果 */}
        <Card>
          <CardHeader>
            <CardTitle>排序预览</CardTitle>
            <CardDescription>
              当前导航栏显示顺序（仅显示可见模块）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sortedNavModules
                .filter(m => m.is_visible)
                .map((module, index) => (
                  <div
                    key={module.id}
                    className="px-4 py-2 rounded-md bg-primary/10 text-primary border border-primary/20"
                  >
                    <span className="text-xs font-medium mr-2">{index + 1}</span>
                    {module.module_name}
                  </div>
                ))}
            </div>
            {sortedNavModules.filter(m => m.is_visible).length === 0 && (
              <p className="text-sm text-muted-foreground">暂无可见的导航模块</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

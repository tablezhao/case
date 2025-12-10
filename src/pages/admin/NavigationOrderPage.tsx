import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getNavigationOrder, updateNavigationOrder, resetNavigationOrder, updateNavigationVisibility } from '@/db/api';
import type { NavigationOrder } from '@/types/types';
import PageMeta from '@/components/common/PageMeta';

export default function NavigationOrderPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<NavigationOrder[]>([]);
  const [editedModules, setEditedModules] = useState<NavigationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadNavigationOrder();
  }, []);

  const loadNavigationOrder = async () => {
    try {
      setLoading(true);
      const data = await getNavigationOrder();
      setModules(data);
      setEditedModules(JSON.parse(JSON.stringify(data))); // 深拷贝
    } catch (error) {
      console.error('加载导航排序失败:', error);
      toast.error('加载导航排序失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSortOrderChange = (id: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) return;

    setEditedModules(prev =>
      prev.map(module =>
        module.id === id ? { ...module, sort_order: numValue } : module
      )
    );
  };

  const handleVisibilityChange = async (id: string, checked: boolean) => {
    try {
      await updateNavigationVisibility(id, checked);
      setEditedModules(prev =>
        prev.map(module =>
          module.id === id ? { ...module, is_visible: checked } : module
        )
      );
      setModules(prev =>
        prev.map(module =>
          module.id === id ? { ...module, is_visible: checked } : module
        )
      );
      toast.success('可见性更新成功');
    } catch (error) {
      console.error('更新可见性失败:', error);
      toast.error('更新可见性失败');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // 检查是否有重复的排序号
      const sortOrders = editedModules.map(m => m.sort_order);
      const uniqueSortOrders = new Set(sortOrders);
      if (sortOrders.length !== uniqueSortOrders.size) {
        toast.error('排序号不能重复，请检查输入');
        return;
      }

      // 准备更新数据
      const updates = editedModules.map(module => ({
        id: module.id,
        sort_order: module.sort_order,
        is_visible: module.is_visible,
      }));

      await updateNavigationOrder(updates);
      await loadNavigationOrder();
      toast.success('导航排序保存成功');
    } catch (error) {
      console.error('保存导航排序失败:', error);
      toast.error('保存导航排序失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      await resetNavigationOrder();
      await loadNavigationOrder();
      toast.success('已恢复默认排序');
    } catch (error) {
      console.error('重置导航排序失败:', error);
      toast.error('重置导航排序失败');
    } finally {
      setResetting(false);
    }
  };

  const handleCancel = () => {
    setEditedModules(JSON.parse(JSON.stringify(modules)));
    toast.info('已取消修改');
  };

  // 检查是否有未保存的更改
  const hasChanges = JSON.stringify(modules.map(m => m.sort_order)) !== JSON.stringify(editedModules.map(m => m.sort_order));

  // 按当前编辑的排序号排序显示
  const sortedModules = [...editedModules].sort((a, b) => a.sort_order - b.sort_order);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageMeta title="导航排序管理" description="调整前端页面导航栏中各模块的显示顺序" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageMeta title="导航排序管理" description="调整前端页面导航栏中各模块的显示顺序" />
      
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">导航排序管理</h1>
            <p className="text-sm text-muted-foreground mt-1">
              调整前端页面导航栏中各模块的显示顺序
            </p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存排序'}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={!hasChanges || saving}
        >
          取消修改
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={resetting}
          className="gap-2 ml-auto"
        >
          <RotateCcw className="w-4 h-4" />
          {resetting ? '重置中...' : '恢复默认'}
        </Button>
      </div>

      {/* 提示信息 */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-medium">使用说明：</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>在输入框中输入数字来调整模块的排序位置（数字越小越靠前）</li>
              <li>使用开关控制模块的显示/隐藏状态</li>
              <li>排序号必须是正整数，且不能重复</li>
              <li>点击"保存排序"按钮应用更改</li>
              <li>点击"恢复默认"可以重置为初始排序</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 模块列表 */}
      <Card>
        <CardHeader>
          <CardTitle>导航模块列表</CardTitle>
          <CardDescription>
            当前共有 {modules.length} 个导航模块
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedModules.map((module, index) => (
              <div
                key={module.id}
                className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                {/* 拖拽图标（装饰性） */}
                <div className="flex-shrink-0">
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* 排序号输入 */}
                <div className="flex-shrink-0 w-24">
                  <Label htmlFor={`sort-${module.id}`} className="text-xs text-muted-foreground">
                    排序号
                  </Label>
                  <Input
                    id={`sort-${module.id}`}
                    type="number"
                    min="1"
                    value={module.sort_order}
                    onChange={(e) => handleSortOrderChange(module.id, e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* 模块信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{module.module_name}</span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                      {module.module_key}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    路由: {module.route_path}
                  </p>
                </div>

                {/* 可见性开关 */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <Label htmlFor={`visible-${module.id}`} className="text-sm cursor-pointer">
                    {module.is_visible ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Label>
                  <Switch
                    id={`visible-${module.id}`}
                    checked={module.is_visible}
                    onCheckedChange={(checked) => handleVisibilityChange(module.id, checked)}
                  />
                </div>

                {/* 当前位置指示 */}
                <div className="flex-shrink-0 w-16 text-center">
                  <span className="text-xs text-muted-foreground">第 {index + 1} 位</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 预览提示 */}
      {hasChanges && (
        <Card className="mt-6 border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              💡 提示：修改后的排序将在保存后立即生效，刷新页面即可看到新的导航顺序
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { getFrontendConfigs, updateFrontendConfig } from '@/db/api';
import type { FrontendConfig } from '@/types/types';

export default function HomeConfigPage() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<FrontendConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await getFrontendConfigs();
      setConfigs(data);
    } catch (error: any) {
      toast.error('加载失败', {
        description: error.message || '无法加载首页配置'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      setSaving(id);
      await updateFrontendConfig(id, { is_visible: !currentState });
      toast.success('保存成功', {
        description: '首页模块配置已更新'
      });
      await loadConfigs();
    } catch (error: any) {
      toast.error('保存失败', {
        description: error.message || '无法更新配置'
      });
    } finally {
      setSaving(null);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getModuleDescription = (moduleKey: string) => {
    const descriptions: Record<string, string> = {
      stats_overview: '显示累计通报案例、涉及应用、最近通报等核心统计数据',
      trend_chart: '显示年度和月度通报案例数量趋势图表',
      geo_map: '显示通报部门所在地理分布的中国地图',
      department_chart: '显示各通报部门出现频次的分布图表',
      platform_chart: '显示被通报应用的来源平台分布图',
      wordcloud: '显示热点违规问题的词云图',
      recent_news: '显示最近发布的监管资讯列表',
    };
    return descriptions[moduleKey] || '暂无描述';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* 顶部导航栏 */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">首页配置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            控制首页各个模块的显示状态
          </p>
        </div>
      </div>

      {/* 配置列表 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {configs.map((config) => (
          <Card key={config.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {config.is_visible ? (
                      <Eye className="w-5 h-5 text-green-500" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    {config.module_name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {getModuleDescription(config.module_key)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium">
                    {config.is_visible ? '当前显示' : '当前隐藏'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {config.is_visible 
                      ? '此模块在首页显示' 
                      : '此模块在首页隐藏'}
                  </p>
                </div>
                <Switch
                  checked={config.is_visible}
                  onCheckedChange={() => handleToggle(config.id, config.is_visible)}
                  disabled={saving === config.id}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 提示信息 */}
      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="w-1 bg-primary rounded-full" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-2">💡 使用提示</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 关闭模块后，该模块将在首页完全隐藏</li>
                <li>• 修改会立即生效，用户刷新页面后即可看到变化</li>
                <li>• 建议至少保留"核心数据总览"模块以提供基本信息</li>
                <li>• 可以根据业务需求灵活调整模块显示</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

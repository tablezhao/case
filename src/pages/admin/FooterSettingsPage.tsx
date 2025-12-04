import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, Eye, ChevronDown, CheckCircle2 } from 'lucide-react';
import { getAllFooterSettings, updateFooterSetting } from '@/db/api';
import type { FooterSettings } from '@/types/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FooterSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<FooterSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAllFooterSettings();
      setSettings(data);
    } catch (error: any) {
      toast.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string, updates: any) => {
    try {
      setSaving(id);
      await updateFooterSetting(id, updates);
      toast.success('保存成功', {
        description: '页脚配置已更新',
      });
      await loadSettings();
    } catch (error: any) {
      toast.error('保存失败', {
        description: error.message,
      });
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    await handleSave(id, { is_active: !currentState });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getSectionName = (section: string) => {
    const names: Record<string, string> = {
      about: '关于我们',
      navigation: '快速导航',
      friendly_links: '友情链接',
      social_media: '社交媒体',
      newsletter: '订阅资讯',
      copyright: '版权信息',
      filing: '备案信息',
      disclaimer: '免责声明',
    };
    return names[section] || section;
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
          <h1 className="text-2xl font-bold">页脚配置管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理网站页脚的各个模块内容，修改后将实时同步到前台展示
          </p>
        </div>
      </div>

      {/* 配置列表 */}
      <div className="space-y-4">
        <Accordion type="single" collapsible className="w-full space-y-3">
          {settings.map((setting) => (
            <AccordionItem
              key={setting.id}
              value={setting.id}
              className="border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <AccordionTrigger className="hover:no-underline px-6 py-4">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">
                      {getSectionName(setting.section)}
                    </span>
                    <Badge
                      variant={setting.is_active ? 'default' : 'secondary'}
                      className={setting.is_active ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {setting.is_active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          已启用
                        </>
                      ) : (
                        '已禁用'
                      )}
                    </Badge>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <SettingEditor
                  setting={setting}
                  onSave={handleSave}
                  onToggleActive={handleToggleActive}
                  saving={saving === setting.id}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

interface SettingEditorProps {
  setting: FooterSettings;
  onSave: (id: string, updates: any) => Promise<void>;
  onToggleActive: (id: string, currentState: boolean) => Promise<void>;
  saving: boolean;
}

function SettingEditor({ setting, onSave, onToggleActive, saving }: SettingEditorProps) {
  const [title, setTitle] = useState(setting.title);
  const [content, setContent] = useState(JSON.stringify(setting.content, null, 2));
  const [displayOrder, setDisplayOrder] = useState(setting.display_order);
  const [contentError, setContentError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async () => {
    // 验证JSON格式
    try {
      const parsedContent = JSON.parse(content);
      setContentError('');
      await onSave(setting.id, {
        title,
        content: parsedContent,
        display_order: displayOrder,
      });
      setHasChanges(false);
    } catch (error) {
      setContentError('JSON格式错误，请检查');
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setContentError('');
    setHasChanges(true);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasChanges(true);
  };

  const handleOrderChange = (value: number) => {
    setDisplayOrder(value);
    setHasChanges(true);
  };

  const renderContentPreview = () => {
    try {
      const data = JSON.parse(content);
      return (
        <div className="bg-muted/50 p-4 rounded-lg border">
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">内容预览</h4>
          <pre className="text-xs overflow-auto max-h-40 font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* 启用/禁用开关 */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex-1">
          <Label className="text-base font-semibold">模块状态</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {setting.is_active ? '此模块当前在前台显示' : '此模块当前在前台隐藏'}
          </p>
        </div>
        <Switch
          checked={setting.is_active}
          onCheckedChange={() => onToggleActive(setting.id, setting.is_active)}
          disabled={saving}
          className="data-[state=checked]:bg-green-500"
        />
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 标题 */}
        <div className="space-y-2">
          <Label htmlFor="title" className="font-semibold">
            模块标题
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="输入模块标题"
            className="transition-all focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 显示顺序 */}
        <div className="space-y-2">
          <Label htmlFor="order" className="font-semibold">
            显示顺序
          </Label>
          <Input
            id="order"
            type="number"
            value={displayOrder}
            onChange={(e) => handleOrderChange(parseInt(e.target.value) || 0)}
            placeholder="数字越小越靠前"
            className="transition-all focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            数字越小，模块在页脚中的位置越靠前
          </p>
        </div>
      </div>

      {/* 内容编辑 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content" className="font-semibold">
            模块内容（JSON格式）
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                查看示例
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>内容格式说明</DialogTitle>
                <DialogDescription>
                  根据不同的模块类型，内容格式有所不同
                </DialogDescription>
              </DialogHeader>
              <ContentFormatGuide section={setting.section} />
            </DialogContent>
          </Dialog>
        </div>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="输入JSON格式的内容"
          rows={12}
          className="font-mono text-sm transition-all focus:ring-2 focus:ring-primary"
        />
        {contentError && (
          <p className="text-sm text-destructive flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-destructive" />
            {contentError}
          </p>
        )}
      </div>

      {/* 内容预览 */}
      {renderContentPreview()}

      {/* 保存按钮 */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="gap-2 min-w-[120px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存修改
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ContentFormatGuide({ section }: { section: string }) {
  const guides: Record<string, any> = {
    about: {
      description: '关于我们模块包含平台简介和联系邮箱',
      example: {
        description: '平台简介文字，建议80字以内',
        email: 'contact@example.com',
      },
    },
    navigation: {
      description: '快速导航包含站内链接列表',
      example: {
        links: [
          { name: '首页', path: '/' },
          { name: '案例查询', path: '/cases' },
        ],
      },
    },
    friendly_links: {
      description: '友情链接包含外部网站链接列表',
      example: {
        links: [
          { name: '工业和信息化部', url: 'https://www.miit.gov.cn' },
          { name: '国家互联网信息办公室', url: 'https://www.cac.gov.cn' },
        ],
      },
    },
    social_media: {
      description: '社交媒体包含各平台信息',
      example: {
        platforms: [
          { name: '微信公众号', icon: '微信', qrcode: true },
          { name: '官方微博', icon: '微博', url: '#' },
        ],
      },
    },
    newsletter: {
      description: 'Newsletter订阅模块配置',
      example: {
        description: '订阅说明文字',
        privacy_note: '隐私声明文字',
        enabled: true,
      },
    },
    copyright: {
      description: '版权信息配置',
      example: {
        company_name: '公司名称',
        show_year: true,
      },
    },
    filing: {
      description: '备案信息配置',
      example: {
        icp: {
          number: '京ICP备XXXXXXXX号',
          url: 'https://beian.miit.gov.cn',
        },
        police: {
          number: '京公网安备XXXXXXXXXXXXX号',
          url: 'http://www.beian.gov.cn',
        },
      },
    },
    disclaimer: {
      description: '免责声明文字',
      example: {
        text: '免责声明的完整文字内容',
      },
    },
  };

  const guide = guides[section] || { description: '暂无说明', example: {} };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">说明</h4>
        <p className="text-sm text-muted-foreground">{guide.description}</p>
      </div>
      <div>
        <h4 className="font-semibold mb-2">示例格式</h4>
        <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto font-mono border">
          {JSON.stringify(guide.example, null, 2)}
        </pre>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { getAllFooterSettings, updateFooterSetting, deleteFooterSetting } from '@/db/api';
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
  const [settings, setSettings] = useState<FooterSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAllFooterSettings();
      setSettings(data);
    } catch (error: any) {
      toast({
        title: '加载失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string, updates: any) => {
    try {
      setSaving(id);
      await updateFooterSetting(id, updates);
      toast({
        title: '保存成功',
        description: '页脚配置已更新',
      });
      await loadSettings();
    } catch (error: any) {
      toast({
        title: '保存失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    await handleSave(id, { is_active: !currentState });
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">页脚配置管理</h1>
        <p className="text-muted-foreground">
          管理网站页脚的各个模块内容，修改后将实时同步到前台展示
        </p>
      </div>

      <div className="space-y-6">
        <Accordion type="single" collapsible className="w-full">
          {settings.map((setting) => (
            <AccordionItem key={setting.id} value={setting.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{getSectionName(setting.section)}</span>
                    {setting.is_active ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        已启用
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        已禁用
                      </span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
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
    } catch (error) {
      setContentError('JSON格式错误，请检查');
    }
  };

  const renderContentPreview = () => {
    try {
      const data = JSON.parse(content);
      return (
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-semibold mb-2">内容预览</h4>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* 启用/禁用开关 */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <Label className="text-base">模块状态</Label>
            <p className="text-sm text-muted-foreground">
              {setting.is_active ? '此模块当前在前台显示' : '此模块当前在前台隐藏'}
            </p>
          </div>
          <Switch
            checked={setting.is_active}
            onCheckedChange={() => onToggleActive(setting.id, setting.is_active)}
            disabled={saving}
          />
        </div>

        {/* 标题 */}
        <div className="space-y-2">
          <Label htmlFor="title">模块标题</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入模块标题"
          />
        </div>

        {/* 显示顺序 */}
        <div className="space-y-2">
          <Label htmlFor="order">显示顺序</Label>
          <Input
            id="order"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            placeholder="数字越小越靠前"
          />
          <p className="text-xs text-muted-foreground">
            数字越小，模块在页脚中的位置越靠前
          </p>
        </div>

        {/* 内容编辑 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">模块内容（JSON格式）</Label>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
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
            onChange={(e) => {
              setContent(e.target.value);
              setContentError('');
            }}
            placeholder="输入JSON格式的内容"
            rows={12}
            className="font-mono text-sm"
          />
          {contentError && (
            <p className="text-sm text-destructive">{contentError}</p>
          )}
        </div>

        {/* 内容预览 */}
        {renderContentPreview()}

        {/* 保存按钮 */}
        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存修改
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
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
        <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
          {JSON.stringify(guide.example, null, 2)}
        </pre>
      </div>
    </div>
  );
}

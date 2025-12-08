import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  Save, 
  ArrowLeft, 
  Eye, 
  CheckCircle2, 
  GripVertical, 
  Edit2,
  Plus,
  EyeOff,
  X,
  Mail,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { getAllFooterSettings, updateFooterSetting, batchUpdateFooterSettings } from '@/db/api';
import type { FooterSettings } from '@/types/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function FooterSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<FooterSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<FooterSettings | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAllFooterSettings();
      setSettings(data);
    } catch (error: any) {
      toast.error('加载失败', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = settings.findIndex((s) => s.id === active.id);
      const newIndex = settings.findIndex((s) => s.id === over.id);

      const newSettings = arrayMove(settings, oldIndex, newIndex);
      setSettings(newSettings);

      // 更新display_order
      try {
        const updates = newSettings.map((s, index) => ({
          id: s.id,
          display_order: index + 1,
        }));
        await batchUpdateFooterSettings(updates);
        toast.success('排序已更新');
      } catch (error: any) {
        toast.error('排序更新失败', {
          description: error.message,
        });
        // 恢复原顺序
        loadSettings();
      }
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await updateFooterSetting(id, { is_active: !currentState });
      toast.success(currentState ? '已隐藏' : '已显示');
      await loadSettings();
    } catch (error: any) {
      toast.error('操作失败', {
        description: error.message,
      });
    }
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

  const getSectionIcon = (section: string) => {
    const icons: Record<string, any> = {
      about: Mail,
      navigation: ExternalLink,
      friendly_links: ExternalLink,
      social_media: Sparkles,
      newsletter: Mail,
      copyright: CheckCircle2,
      filing: CheckCircle2,
      disclaimer: CheckCircle2,
    };
    const Icon = icons[section] || CheckCircle2;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
          <div>
            <h1 className="text-2xl font-bold">页脚配置管理</h1>
            <p className="text-sm text-muted-foreground mt-1">
              拖拽调整顺序，点击编辑内容，一键开关显示
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? '隐藏预览' : '实时预览'}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧：配置列表 */}
        <div className={showPreview ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
                页脚模块列表
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                拖拽左侧图标可调整模块显示顺序
              </p>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={settings.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {settings.map((setting) => (
                      <SortableItem
                        key={setting.id}
                        setting={setting}
                        getSectionName={getSectionName}
                        getSectionIcon={getSectionIcon}
                        onToggleActive={handleToggleActive}
                        onEdit={setEditingSection}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：实时预览 */}
        {showPreview && (
          <div className="xl:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  实时预览
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  前台页脚显示效果
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <FooterPreview settings={settings.filter((s) => s.is_active)} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 编辑对话框 */}
      {editingSection && (
        <EditDialog
          setting={editingSection}
          onClose={() => setEditingSection(null)}
          onSave={async (updates) => {
            try {
              setSaving(true);
              await updateFooterSetting(editingSection.id, updates);
              toast.success('保存成功');
              await loadSettings();
              setEditingSection(null);
            } catch (error: any) {
              toast.error('保存失败', {
                description: error.message,
              });
            } finally {
              setSaving(false);
            }
          }}
          saving={saving}
          getSectionName={getSectionName}
        />
      )}
    </div>
  );
}

// 可排序项组件
interface SortableItemProps {
  setting: FooterSettings;
  getSectionName: (section: string) => string;
  getSectionIcon: (section: string) => React.ReactElement;
  onToggleActive: (id: string, currentState: boolean) => void;
  onEdit: (setting: FooterSettings) => void;
}

function SortableItem({
  setting,
  getSectionName,
  getSectionIcon,
  onToggleActive,
  onEdit,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: setting.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:shadow-md transition-all group"
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* 图标 */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {getSectionIcon(setting.section)}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{getSectionName(setting.section)}</h3>
          <Badge
            variant={setting.is_active ? 'default' : 'secondary'}
            className={setting.is_active ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            {setting.is_active ? '显示' : '隐藏'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">{setting.title}</p>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(setting)}
          className="h-8 w-8 p-0"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Switch
          checked={setting.is_active}
          onCheckedChange={() => onToggleActive(setting.id, setting.is_active)}
          className="data-[state=checked]:bg-green-500"
        />
      </div>
    </div>
  );
}

// 编辑对话框组件
interface EditDialogProps {
  setting: FooterSettings;
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
  saving: boolean;
  getSectionName: (section: string) => string;
}

function EditDialog({ setting, onClose, onSave, saving, getSectionName }: EditDialogProps) {
  const [title, setTitle] = useState(setting.title);
  const [content, setContent] = useState(setting.content);

  const handleSave = async () => {
    await onSave({
      title,
      content,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            编辑 {getSectionName(setting.section)}
          </DialogTitle>
          <DialogDescription>
            修改模块标题和内容，保存后将立即生效
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          {/* 根据section类型渲染不同的编辑表单 */}
          <ContentEditor
            section={setting.section}
            content={content}
            onChange={setContent}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 内容编辑器组件
interface ContentEditorProps {
  section: string;
  content: any;
  onChange: (content: any) => void;
}

function ContentEditor({ section, content, onChange }: ContentEditorProps) {
  const updateField = (field: string, value: any) => {
    onChange({ ...content, [field]: value });
  };

  const updateArrayItem = (arrayName: string, index: number, field: string, value: any) => {
    const newArray = [...(content[arrayName] || [])];
    newArray[index] = { ...newArray[index], [field]: value };
    onChange({ ...content, [arrayName]: newArray });
  };

  const addArrayItem = (arrayName: string, defaultItem: any) => {
    const newArray = [...(content[arrayName] || []), defaultItem];
    onChange({ ...content, [arrayName]: newArray });
  };

  const removeArrayItem = (arrayName: string, index: number) => {
    const newArray = (content[arrayName] || []).filter((_: any, i: number) => i !== index);
    onChange({ ...content, [arrayName]: newArray });
  };

  // 关于我们
  if (section === 'about') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>描述</Label>
          <Textarea
            value={content.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="输入关于我们的描述"
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label>联系邮箱</Label>
          <Input
            type="email"
            value={content.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="contact@example.com"
          />
        </div>
      </div>
    );
  }

  // 快速导航
  if (section === 'navigation') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>导航链接</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('links', { name: '', path: '' })}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            添加链接
          </Button>
        </div>
        <div className="space-y-3">
          {(content.links || []).map((link: any, index: number) => (
            <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Input
                  value={link.name || ''}
                  onChange={(e) => updateArrayItem('links', index, 'name', e.target.value)}
                  placeholder="链接名称"
                />
                <Input
                  value={link.path || ''}
                  onChange={(e) => updateArrayItem('links', index, 'path', e.target.value)}
                  placeholder="/path"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeArrayItem('links', index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 友情链接
  if (section === 'friendly_links') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>友情链接</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('links', { name: '', url: '' })}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            添加链接
          </Button>
        </div>
        <div className="space-y-3">
          {(content.links || []).map((link: any, index: number) => (
            <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Input
                  value={link.name || ''}
                  onChange={(e) => updateArrayItem('links', index, 'name', e.target.value)}
                  placeholder="网站名称"
                />
                <Input
                  value={link.url || ''}
                  onChange={(e) => updateArrayItem('links', index, 'url', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeArrayItem('links', index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 社交媒体
  if (section === 'social_media') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>社交平台</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('platforms', { name: '', icon: '', url: '' })}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            添加平台
          </Button>
        </div>
        <div className="space-y-3">
          {(content.platforms || []).map((platform: any, index: number) => (
            <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Input
                  value={platform.name || ''}
                  onChange={(e) => updateArrayItem('platforms', index, 'name', e.target.value)}
                  placeholder="平台名称（如：微信）"
                />
                <Input
                  value={platform.icon || ''}
                  onChange={(e) => updateArrayItem('platforms', index, 'icon', e.target.value)}
                  placeholder="图标（如：微）"
                />
                <Input
                  value={platform.url || ''}
                  onChange={(e) => updateArrayItem('platforms', index, 'url', e.target.value)}
                  placeholder="链接地址"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeArrayItem('platforms', index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 订阅资讯
  if (section === 'newsletter') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>启用订阅功能</Label>
          <Switch
            checked={content.enabled || false}
            onCheckedChange={(checked) => updateField('enabled', checked)}
          />
        </div>
        <div className="space-y-2">
          <Label>描述文字</Label>
          <Textarea
            value={content.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="订阅描述"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>隐私说明</Label>
          <Input
            value={content.privacy_note || ''}
            onChange={(e) => updateField('privacy_note', e.target.value)}
            placeholder="我们尊重您的隐私"
          />
        </div>
      </div>
    );
  }

  // 版权信息
  if (section === 'copyright') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>公司名称</Label>
          <Input
            value={content.company_name || ''}
            onChange={(e) => updateField('company_name', e.target.value)}
            placeholder="公司名称"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>显示年份</Label>
          <Switch
            checked={content.show_year || false}
            onCheckedChange={(checked) => updateField('show_year', checked)}
          />
        </div>
      </div>
    );
  }

  // 备案信息
  if (section === 'filing') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>ICP备案号</Label>
          <Input
            value={content.icp?.number || ''}
            onChange={(e) => updateField('icp', { ...content.icp, number: e.target.value })}
            placeholder="京ICP备xxxxxxxx号"
          />
        </div>
        <div className="space-y-2">
          <Label>ICP备案链接</Label>
          <Input
            value={content.icp?.url || ''}
            onChange={(e) => updateField('icp', { ...content.icp, url: e.target.value })}
            placeholder="https://beian.miit.gov.cn"
          />
        </div>
        <div className="space-y-2">
          <Label>公安备案号</Label>
          <Input
            value={content.police?.number || ''}
            onChange={(e) => updateField('police', { ...content.police, number: e.target.value })}
            placeholder="京公网安备xxxxxxxx号"
          />
        </div>
        <div className="space-y-2">
          <Label>公安备案链接</Label>
          <Input
            value={content.police?.url || ''}
            onChange={(e) => updateField('police', { ...content.police, url: e.target.value })}
            placeholder="http://www.beian.gov.cn"
          />
        </div>
      </div>
    );
  }

  // 免责声明
  if (section === 'disclaimer') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>免责声明内容</Label>
          <Textarea
            value={content.text || ''}
            onChange={(e) => updateField('text', e.target.value)}
            placeholder="输入免责声明内容"
            rows={6}
          />
        </div>
      </div>
    );
  }

  // 默认：JSON编辑器
  return (
    <div className="space-y-2">
      <Label>内容（JSON格式）</Label>
      <Textarea
        value={JSON.stringify(content, null, 2)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            // 忽略JSON解析错误
          }
        }}
        rows={10}
        className="font-mono text-sm"
      />
    </div>
  );
}

// 页脚预览组件
interface FooterPreviewProps {
  settings: FooterSettings[];
}

function FooterPreview({ settings }: FooterPreviewProps) {
  const getSetting = (section: string) => {
    return settings.find((s) => s.section === section);
  };

  const aboutSetting = getSetting('about');
  const copyrightSetting = getSetting('copyright');

  return (
    <div className="space-y-4 text-xs">
      {/* 简化预览 */}
      {aboutSetting && (
        <div>
          <h4 className="font-semibold mb-2">{aboutSetting.title}</h4>
          <p className="text-muted-foreground text-xs line-clamp-2">
            {aboutSetting.content.description}
          </p>
        </div>
      )}
      
      {copyrightSetting && (
        <div className="pt-3 border-t text-center text-muted-foreground">
          <p className="text-xs">
            © {copyrightSetting.content.show_year ? new Date().getFullYear() : ''}{' '}
            {copyrightSetting.content.company_name}
          </p>
        </div>
      )}

      <div className="text-center text-muted-foreground">
        <p className="text-xs">共 {settings.length} 个模块已启用</p>
      </div>
    </div>
  );
}

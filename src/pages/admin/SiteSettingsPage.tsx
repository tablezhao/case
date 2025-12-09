import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { getSiteSettings, updateSiteSettings, uploadLogo, deleteLogo } from '@/db/api';
import type { SiteSettings } from '@/types/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SiteSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [siteTitle, setSiteTitle] = useState('');
  const [siteSubtitle, setSiteSubtitle] = useState('');
  const [browserTitle, setBrowserTitle] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSiteSettings();
      if (data) {
        setSettings(data);
        setSiteTitle(data.site_title);
        setSiteSubtitle(data.site_subtitle || '');
        setBrowserTitle(data.browser_title || '');
        setLogoUrl(data.logo_url);
        setLogoPreview(data.logo_url);
      }
    } catch (error: any) {
      toast.error('加载失败', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('文件格式不支持', {
        description: '请上传 PNG、JPG 或 SVG 格式的图片',
      });
      return;
    }

    // 验证文件大小（2MB）
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('文件过大', {
        description: '图片大小不能超过 2MB',
      });
      return;
    }

    setLogoFile(file);

    // 生成预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    // 验证必填字段
    if (!siteTitle.trim()) {
      toast.error('请输入网站主标题');
      return;
    }

    // 验证字符长度
    if (siteTitle.length > 200) {
      toast.error('网站主标题不能超过200个字符');
      return;
    }

    if (siteSubtitle.length > 100) {
      toast.error('网站备用名称不能超过100个字符');
      return;
    }

    if (browserTitle.length > 100) {
      toast.error('浏览器标签标题不能超过100个字符');
      return;
    }

    try {
      setSaving(true);

      let finalLogoUrl = logoUrl;

      // 如果有新上传的Logo
      if (logoFile) {
        setUploading(true);
        try {
          // 删除旧Logo（如果存在）
          if (logoUrl) {
            try {
              await deleteLogo(logoUrl);
            } catch (error) {
              console.error('删除旧Logo失败:', error);
            }
          }

          // 上传新Logo
          finalLogoUrl = await uploadLogo(logoFile);
          toast.success('Logo上传成功');
        } catch (error: any) {
          toast.error('Logo上传失败', {
            description: error.message,
          });
          return;
        } finally {
          setUploading(false);
        }
      }

      // 如果用户删除了Logo
      if (logoUrl && !logoPreview && !logoFile) {
        try {
          await deleteLogo(logoUrl);
          finalLogoUrl = null;
        } catch (error) {
          console.error('删除Logo失败:', error);
        }
      }

      // 更新配置
      await updateSiteSettings(settings.id, {
        site_title: siteTitle.trim(),
        site_subtitle: siteSubtitle.trim() || null,
        browser_title: browserTitle.trim() || null,
        logo_url: finalLogoUrl,
      });

      toast.success('保存成功', {
        description: '网站信息已更新',
      });

      // 重新加载配置
      await loadSettings();
      setLogoFile(null);
    } catch (error: any) {
      toast.error('保存失败', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            未找到网站配置信息，请联系技术支持。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
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
          <h1 className="text-2xl font-bold">网站基本信息配置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理网站的标题、名称和Logo，修改后将实时同步到前台展示
          </p>
        </div>
      </div>

      {/* 配置表单 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>
            配置网站的基本展示信息，包括标题、名称和品牌标识
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 网站主标题 */}
          <div className="space-y-2">
            <Label htmlFor="site-title" className="flex items-center gap-2">
              网站主标题
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="site-title"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="输入网站主标题"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              网站的全称或主要展示标题，最多200个字符（当前：{siteTitle.length}/200）
            </p>
          </div>

          {/* 网站备用名称 */}
          <div className="space-y-2">
            <Label htmlFor="site-subtitle">
              网站备用名称/简称
            </Label>
            <Input
              id="site-subtitle"
              value={siteSubtitle}
              onChange={(e) => setSiteSubtitle(e.target.value)}
              placeholder="输入网站备用名称或简称（可选）"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              网站的简短名称或用于特定场景的替代名称，最多100个字符（当前：{siteSubtitle.length}/100）
            </p>
          </div>

          {/* 浏览器标签标题 */}
          <div className="space-y-2">
            <Label htmlFor="browser-title">
              浏览器标签标题
            </Label>
            <Input
              id="browser-title"
              value={browserTitle}
              onChange={(e) => setBrowserTitle(e.target.value)}
              placeholder="输入浏览器标签显示的标题（可选）"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              显示在浏览器标签页的标题，建议不超过60个字符以确保完整显示（当前：{browserTitle.length}/100）
            </p>
            {!browserTitle && (
              <p className="text-xs text-amber-600">
                💡 如果不填写，将使用默认标题"合规通 Case Wiki"
              </p>
            )}
          </div>

          {/* Logo图片 */}
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                网站Logo图片
              </Label>
              <p className="text-xs text-muted-foreground mb-4">
                代表网站品牌标识的主要图像
              </p>
            </div>

            {/* Logo预览 */}
            {logoPreview && (
              <div className="relative inline-block">
                <div className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                  <img
                    src={logoPreview}
                    alt="Logo预览"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={handleRemoveLogo}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* 上传按钮 */}
            {!logoPreview && (
              <div className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">点击上传Logo</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 上传说明 */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <div className="space-y-1">
                  <p><strong>格式要求：</strong>支持 PNG、JPG、SVG 格式</p>
                  <p><strong>大小限制：</strong>不超过 2MB</p>
                  <p><strong>尺寸建议：</strong>建议使用正方形图片，最小 200x200 像素</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* 更换Logo按钮 */}
            {logoPreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                更换Logo
              </Button>
            )}
          </div>

          {/* 保存按钮 */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving || uploading}
              className="gap-2"
            >
              {(saving || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? '上传中...' : saving ? '保存中...' : '保存更改'}
            </Button>
            {(saving || uploading) && (
              <p className="text-sm text-muted-foreground">
                {uploading ? '正在上传Logo图片...' : '正在保存配置...'}
              </p>
            )}
          </div>

          {/* 成功提示 */}
          {!saving && !uploading && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                修改后点击"保存更改"按钮，配置将立即同步到前台展示
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

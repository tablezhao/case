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
import { getSiteSettings, updateSiteSettings, uploadLogo, deleteLogo, uploadFavicon, deleteFavicon } from '@/db/api';
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
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Favicon相关状态
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [faviconUrlInput, setFaviconUrlInput] = useState('');
  const [useFaviconUrlInput, setUseFaviconUrlInput] = useState(false);
  const [faviconImageLoadError, setFaviconImageLoadError] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconFileInputRef = useRef<HTMLInputElement>(null);

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
        setLogoUrlInput(data.logo_url || '');
        setFaviconUrl(data.favicon_url);
        setFaviconPreview(data.favicon_url);
        setFaviconUrlInput(data.favicon_url || '');
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

  const handleFaviconFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/x-icon'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('文件格式不支持', {
        description: '请上传 PNG 或 ICO 格式的图片',
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

    setFaviconFile(file);

    // 生成预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setFaviconPreview(reader.result as string);
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

  const handleRemoveFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
    setFaviconUrl(null);
    if (faviconFileInputRef.current) {
      faviconFileInputRef.current.value = '';
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

      // 如果使用URL输入模式
      if (useUrlInput) {
        const trimmedUrl = logoUrlInput.trim();
        
        if (trimmedUrl) {
          // 验证URL格式
          try {
            const urlObj = new URL(trimmedUrl);
            
            // 验证是否是HTTP/HTTPS协议
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
              toast.error('Logo URL格式不正确', {
                description: '请使用 http:// 或 https:// 开头的URL',
              });
              setSaving(false);
              return;
            }
            
            // 验证URL是否指向图片
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
            const pathname = urlObj.pathname.toLowerCase();
            const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
            
            if (!hasImageExtension) {
              console.warn('URL可能不是图片文件，但仍然允许使用');
            }
            
            finalLogoUrl = trimmedUrl;
            console.log('使用URL输入的Logo:', finalLogoUrl);
          } catch (urlError) {
            console.error('URL验证失败:', urlError);
            toast.error('Logo URL格式不正确', {
              description: '请输入有效的图片URL，例如：https://example.com/logo.png',
            });
            setSaving(false);
            return;
          }
        } else {
          // URL输入模式下，如果URL为空，则清除Logo
          if (logoUrl) {
            console.log('URL输入模式下清除Logo');
            try {
              await deleteLogo(logoUrl);
            } catch (error) {
              console.error('删除旧Logo失败:', error);
            }
          }
          finalLogoUrl = null;
        }
      }
      // 如果有新上传的Logo文件
      else if (logoFile) {
        setUploading(true);
        try {
          console.log('开始上传Logo文件:', logoFile.name);
          
          // 删除旧Logo（如果存在且不是URL）
          if (logoUrl && !logoUrl.startsWith('http')) {
            try {
              console.log('删除旧Logo:', logoUrl);
              await deleteLogo(logoUrl);
            } catch (error) {
              console.error('删除旧Logo失败:', error);
            }
          }

          // 上传新Logo
          finalLogoUrl = await uploadLogo(logoFile);
          console.log('Logo上传成功:', finalLogoUrl);
          toast.success('Logo上传成功');
        } catch (error: any) {
          console.error('Logo上传失败:', error);
          toast.error('Logo上传失败', {
            description: error.message || '存储桶可能未创建，请使用URL输入方式',
          });
          setSaving(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }
      // 如果用户清除了Logo（非URL输入模式）
      else if (!useUrlInput && logoUrl && !logoPreview && !logoFile) {
        console.log('清除Logo');
        try {
          if (!logoUrl.startsWith('http')) {
            await deleteLogo(logoUrl);
          }
          finalLogoUrl = null;
        } catch (error) {
          console.error('删除Logo失败:', error);
        }
      }

      console.log('准备更新配置，Logo URL:', finalLogoUrl);

      // 处理favicon
      let finalFaviconUrl = faviconUrl;

      // 如果使用URL输入模式
      if (useFaviconUrlInput) {
        const trimmedUrl = faviconUrlInput.trim();
        
        if (trimmedUrl) {
          // 验证URL格式
          try {
            const urlObj = new URL(trimmedUrl);
            
            // 验证是否是HTTP/HTTPS协议
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
              toast.error('Favicon URL格式不正确', {
                description: '请使用 http:// 或 https:// 开头的URL',
              });
              setSaving(false);
              return;
            }
            
            // 验证URL是否指向图片
            const imageExtensions = ['.png', '.ico'];
            const pathname = urlObj.pathname.toLowerCase();
            const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
            
            if (!hasImageExtension) {
              console.warn('URL可能不是图片文件，但仍然允许使用');
            }
            
            finalFaviconUrl = trimmedUrl;
            console.log('使用URL输入的Favicon:', finalFaviconUrl);
          } catch (urlError) {
            console.error('URL验证失败:', urlError);
            toast.error('Favicon URL格式不正确', {
              description: '请输入有效的图片URL，例如：https://example.com/favicon.ico',
            });
            setSaving(false);
            return;
          }
        } else {
          // URL输入模式下，如果URL为空，则清除Favicon
          if (faviconUrl) {
            console.log('URL输入模式下清除Favicon');
            try {
              await deleteFavicon(faviconUrl);
            } catch (error) {
              console.error('删除旧Favicon失败:', error);
            }
          }
          finalFaviconUrl = null;
        }
      }
      // 如果有新上传的Favicon文件
      else if (faviconFile) {
        setUploading(true);
        try {
          console.log('开始上传Favicon文件:', faviconFile.name);
          
          // 删除旧Favicon（如果存在且不是URL）
          if (faviconUrl && !faviconUrl.startsWith('http')) {
            try {
              console.log('删除旧Favicon:', faviconUrl);
              await deleteFavicon(faviconUrl);
            } catch (error) {
              console.error('删除旧Favicon失败:', error);
            }
          }

          // 上传新Favicon
          finalFaviconUrl = await uploadFavicon(faviconFile);
          console.log('Favicon上传成功:', finalFaviconUrl);
          toast.success('Favicon上传成功');
        } catch (error: any) {
          console.error('Favicon上传失败:', error);
          toast.error('Favicon上传失败', {
            description: error.message || '存储桶可能未创建，请使用URL输入方式',
          });
          setSaving(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }
      // 如果用户清除了Favicon（非URL输入模式）
      else if (!useFaviconUrlInput && faviconUrl && !faviconPreview && !faviconFile) {
        console.log('清除Favicon');
        try {
          if (!faviconUrl.startsWith('http')) {
            await deleteFavicon(faviconUrl);
          }
          finalFaviconUrl = null;
        } catch (error) {
          console.error('删除Favicon失败:', error);
        }
      }

      // 更新配置
      await updateSiteSettings(settings.id, {
        site_title: siteTitle.trim(),
        site_subtitle: siteSubtitle.trim() || null,
        browser_title: browserTitle.trim() || null,
        logo_url: finalLogoUrl,
        favicon_url: finalFaviconUrl,
      });

      console.log('配置更新成功');
      
      toast.success('保存成功', {
        description: '网站信息已更新',
      });

      // 重新加载配置
      await loadSettings();
      setLogoFile(null);
      // 不要自动关闭URL输入模式，让用户可以继续编辑
      // setUseUrlInput(false);
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error('保存失败', {
        description: error.message || '请检查网络连接或联系技术支持',
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

            {/* 切换输入方式 */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!useUrlInput ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setUseUrlInput(false);
                  setLogoUrlInput('');
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                上传文件
              </Button>
              <Button
                type="button"
                variant={useUrlInput ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setUseUrlInput(true);
                  setLogoFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                输入URL
              </Button>
            </div>

            {/* URL输入模式 */}
            {useUrlInput ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo图片URL</Label>
                  <Input
                    id="logo-url"
                    value={logoUrlInput}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      setLogoUrlInput(newUrl);
                      setLogoPreview(newUrl || null);
                      setImageLoadError(false); // 重置错误状态
                    }}
                    placeholder="https://example.com/logo.png"
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    输入Logo图片的完整URL地址
                  </p>
                </div>

                {/* URL预览 */}
                {logoUrlInput && (
                  <div className="relative inline-block">
                    <div className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                      {!imageLoadError ? (
                        <img
                          src={logoUrlInput}
                          alt="Logo预览"
                          className="max-w-full max-h-full object-contain"
                          onLoad={() => {
                            setImageLoadError(false);
                          }}
                          onError={() => {
                            setImageLoadError(true);
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <AlertCircle className="w-8 h-8 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            图片加载失败
                          </p>
                          <p className="text-xs text-muted-foreground">
                            请检查URL是否正确
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                      onClick={() => {
                        setLogoUrlInput('');
                        setLogoPreview(null);
                        setImageLoadError(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <div className="space-y-1">
                      <p><strong>推荐图床：</strong></p>
                      <p>• <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ImgBB</a> - 免费图床，支持直链</p>
                      <p>• <a href="https://imgur.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Imgur</a> - 老牌图床，稳定可靠</p>
                      <p>• <a href="https://sm.ms/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SM.MS</a> - 国内访问快速</p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              /* 文件上传模式 */
              <>
                {/* Logo预览 */}
                {logoPreview && !useUrlInput && (
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
                      <p className="text-amber-600 mt-2">⚠️ 如果上传失败，请切换到"输入URL"模式</p>
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
              </>
            )}
          </div>

          {/* Favicon图片 */}
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                网站Favicon图片
              </Label>
              <p className="text-xs text-muted-foreground mb-4">
                显示在浏览器标签页的图标，建议尺寸为16×16px、32×32px、48×48px
              </p>
            </div>

            {/* 切换输入方式 */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!useFaviconUrlInput ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setUseFaviconUrlInput(false);
                  setFaviconUrlInput('');
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                上传文件
              </Button>
              <Button
                type="button"
                variant={useFaviconUrlInput ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setUseFaviconUrlInput(true);
                  setFaviconFile(null);
                  if (faviconFileInputRef.current) {
                    faviconFileInputRef.current.value = '';
                  }
                }}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                输入URL
              </Button>
            </div>

            {/* URL输入模式 */}
            {useFaviconUrlInput ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="favicon-url">Favicon图片URL</Label>
                  <Input
                    id="favicon-url"
                    value={faviconUrlInput}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      setFaviconUrlInput(newUrl);
                      setFaviconPreview(newUrl || null);
                      setFaviconImageLoadError(false); // 重置错误状态
                    }}
                    placeholder="https://example.com/favicon.ico"
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    输入Favicon图片的完整URL地址
                  </p>
                </div>

                {/* URL预览 */}
                {faviconUrlInput && (
                  <div className="relative inline-block">
                    <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                      {!faviconImageLoadError ? (
                        <img
                          src={faviconUrlInput}
                          alt="Favicon预览"
                          className="max-w-full max-h-full object-contain"
                          onLoad={() => {
                            setFaviconImageLoadError(false);
                          }}
                          onError={() => {
                            setFaviconImageLoadError(true);
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <AlertCircle className="w-8 h-8 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            图片加载失败
                          </p>
                          <p className="text-xs text-muted-foreground">
                            请检查URL是否正确
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                      onClick={() => {
                        setFaviconUrlInput('');
                        setFaviconPreview(null);
                        setFaviconImageLoadError(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <div className="space-y-1">
                      <p><strong>推荐图床：</strong></p>
                      <p>• <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ImgBB</a> - 免费图床，支持直链</p>
                      <p>• <a href="https://imgur.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Imgur</a> - 老牌图床，稳定可靠</p>
                      <p>• <a href="https://sm.ms/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SM.MS</a> - 国内访问快速</p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              /* 文件上传模式 */
              <>
                {/* Favicon预览 */}
                {faviconPreview && !useFaviconUrlInput && (
                  <div className="relative inline-block">
                    <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                      <img
                        src={faviconPreview}
                        alt="Favicon预览"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                      onClick={handleRemoveFavicon}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* 上传按钮 */}
                {!faviconPreview && (
                  <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => faviconFileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">点击上传Favicon</p>
                  </div>
                )}

                <input
                  ref={faviconFileInputRef}
                  type="file"
                  accept="image/png,image/x-icon"
                  onChange={handleFaviconFileSelect}
                  className="hidden"
                />

                {/* 上传说明 */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <div className="space-y-1">
                      <p><strong>格式要求：</strong>支持 PNG、ICO 格式</p>
                      <p><strong>大小限制：</strong>不超过 2MB</p>
                      <p><strong>尺寸建议：</strong>建议使用16×16px、32×32px、48×48px尺寸</p>
                      <p className="text-amber-600 mt-2">⚠️ 如果上传失败，请切换到"输入URL"模式</p>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* 更换Favicon按钮 */}
                {faviconPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => faviconFileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    更换Favicon
                  </Button>
                )}
              </>
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

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCaseById } from '@/db/api';
import type { CaseWithDetails } from '@/types/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  ZoomIn,
  ZoomOut,
  Calendar,
  Building2,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    if (id) {
      loadCaseDetail();
    }
  }, [id]);

  const loadCaseDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await getCaseById(id);
      if (!data) {
        toast.error('案例不存在');
        navigate('/cases');
        return;
      }
      setCaseData(data);
    } catch (error) {
      console.error('加载案例详情失败:', error);
      toast.error('加载案例详情失败');
      navigate('/cases');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/cases');
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = `${caseData?.app_name} - 违规通报案例`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'wechat':
        // 微信分享需要使用微信SDK，这里提供复制链接功能
        navigator.clipboard.writeText(url);
        toast.success('链接已复制，可在微信中分享');
        break;
      case 'weibo':
        shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'qq':
        shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('链接已复制到剪贴板');
        break;
      default:
        break;
    }
  };

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 12));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">案例不存在</p>
            <Button onClick={handleBack} className="mt-4">
              返回列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        
        <div className="flex items-center gap-2">
          {/* 字体大小调节 */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseFontSize}
              disabled={fontSize <= 12}
              title="缩小字体"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2 border-x">
              {fontSize}px
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseFontSize}
              disabled={fontSize >= 24}
              title="放大字体"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* 分享按钮 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                分享
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShare('wechat')}>
                分享到微信
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('weibo')}>
                分享到微博
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('qq')}>
                分享到QQ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('copy')}>
                复制链接
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 案例内容 */}
      <Card>
        <CardContent className="p-8">
          {/* 标题 */}
          <h1 className="text-3xl font-bold mb-6">{caseData.app_name}</h1>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{caseData.report_date}</span>
            </div>
            {caseData.department && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">{caseData.department.name}</span>
              </div>
            )}
            {caseData.platform && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm">应用来源：{caseData.platform.name}</span>
              </div>
            )}
            {/* 原文链接移到这里 */}
            {caseData.source_url && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={caseData.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  查看原文链接
                </a>
              </Button>
            )}
          </div>

          {/* 开发者信息 */}
          {caseData.app_developer && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">开发者/运营者</h3>
              <p className="text-sm leading-relaxed">{caseData.app_developer}</p>
            </div>
          )}

          {/* 违规内容 */}
          <div
            className="prose prose-slate max-w-none"
            style={{ fontSize: `${fontSize}px` }}
          >
            <h3 className="text-lg font-semibold mb-3">主要违规内容</h3>
            <div className="whitespace-pre-wrap leading-relaxed">
              {caseData.violation_content || '暂无详细内容'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 底部返回按钮 */}
      <div className="mt-6 text-center">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>
      </div>
    </div>
  );
}

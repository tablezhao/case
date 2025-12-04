import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCaseById } from '@/db/api';
import type { CaseWithDetails } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, Calendar, Building2, Smartphone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

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
      if (data) {
        setCaseData(data);
      } else {
        toast.error('案例不存在');
        navigate('/cases');
      }
    } catch (error) {
      console.error('加载案例详情失败:', error);
      toast.error('加载案例详情失败');
      navigate('/cases');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 max-w-5xl">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (!caseData) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 max-w-5xl">
      {/* 顶部导航 */}
      <div className="mb-4 sm:mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/cases')}
          className="gap-2 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          返回案例列表
        </Button>
      </div>

      {/* 核心信息卡片 */}
      <Card className="shadow-lg mb-4 sm:mb-6">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl mb-2 leading-tight">{caseData.app_name}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="destructive" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  违规通报
                </Badge>
                {caseData.department && (
                  <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                    <Building2 className="w-3 h-3 mr-1" />
                    {caseData.department.name}
                  </Badge>
                )}
                {caseData.platform && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <Smartphone className="w-3 h-3 mr-1" />
                    {caseData.platform.name}
                  </Badge>
                )}
              </div>
            </div>
            {caseData.source_url && (
              <Button variant="default" asChild>
                <a
                  href={caseData.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  查看原文
                </a>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          {/* 基本信息网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">通报日期</span>
              </div>
              <p className="text-base sm:text-lg font-semibold">{caseData.report_date}</p>
            </div>

            {caseData.app_developer && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">开发者/运营者</span>
                </div>
                <p className="text-base sm:text-lg">{caseData.app_developer}</p>
              </div>
            )}
          </div>

          <Separator className="my-4 sm:my-6" />

          {/* 主要违规内容 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h3 className="text-lg sm:text-xl font-bold">主要违规内容</h3>
            </div>
            <Card className="bg-muted/30 border-l-4 border-l-destructive">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="prose prose-sm max-w-none">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {caseData.violation_content || '暂无违规内容描述'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 辅助信息卡片 */}
      <Card className="shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">案例信息</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">案例编号</span>
              <span className="font-mono text-xs sm:text-sm">{caseData.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">录入时间</span>
              <span className="text-xs sm:text-sm">{new Date(caseData.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">更新时间</span>
              <span className="text-xs sm:text-sm">{new Date(caseData.updated_at).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">数据来源</span>
              <span className="text-xs sm:text-sm">官方通报</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 底部操作栏 */}
      <div className="mt-4 sm:mt-6 flex justify-center">
        <Button
          variant="outline"
          onClick={() => navigate('/cases')}
          className="gap-2 min-h-[44px] w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          返回案例列表
        </Button>
      </div>
    </div>
  );
}

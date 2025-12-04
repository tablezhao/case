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
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 max-w-4xl">
      {/* 顶部导航 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/cases')}
          className="gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回案例列表
        </Button>
      </div>

      {/* 主内容卡片 */}
      <Card className="shadow-lg border-t-4 border-t-destructive">
        <CardHeader className="pb-4 px-6 pt-8">
          {/* 应用名称 - 最突出 */}
          <CardTitle className="text-3xl font-bold mb-4 text-foreground">
            {caseData.app_name}
          </CardTitle>

          {/* 标签组 */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="destructive" className="text-sm px-3 py-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
              违规通报
            </Badge>
            {caseData.platform && (
              <Badge className="text-sm px-3 py-1.5 font-medium bg-orange-500 hover:bg-orange-600">
                <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                {caseData.platform.name}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-8 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>通报日期</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{caseData.report_date}</p>
            </div>

            {caseData.department && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>监管部门</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{caseData.department.name}</p>
              </div>
            )}

            {caseData.app_developer && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>开发者/运营者</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{caseData.app_developer}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* 主要违规内容 - 核心信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-destructive rounded-full"></div>
              <h3 className="text-xl font-bold text-foreground">主要违规内容</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-6 border-l-4 border-l-destructive">
              <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">
                {caseData.violation_content || '暂无违规内容描述'}
              </p>
            </div>
          </div>

          {/* 原文链接 */}
          {caseData.source_url && (
            <>
              <Separator />
              <div className="flex justify-center">
                <Button variant="default" size="lg" asChild className="gap-2">
                  <a
                    href={caseData.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    查看官方原文
                  </a>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 底部返回按钮 */}
      <div className="mt-6 flex justify-center">
        <Button
          variant="outline"
          onClick={() => navigate('/cases')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回案例列表
        </Button>
      </div>
    </div>
  );
}

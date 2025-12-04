import { useEffect, useState } from 'react';
import { getCases } from '@/db/api';
import type { CaseWithDetails } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function CasesPage() {
  const [cases, setCases] = useState<CaseWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadCases();
  }, [page]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const result = await getCases(page, pageSize);
      setCases(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('加载案例失败:', error);
      toast.error('加载案例失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (caseItem: CaseWithDetails) => {
    setSelectedCase(caseItem);
    setDialogOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && page === 1) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>案例查询</CardTitle>
          <p className="text-sm text-muted-foreground">共 {total} 条案例</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>通报日期</TableHead>
                  <TableHead>应用名称</TableHead>
                  <TableHead>开发者/运营者</TableHead>
                  <TableHead>监管部门</TableHead>
                  <TableHead>应用平台</TableHead>
                  <TableHead>违规摘要</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="whitespace-nowrap">
                        {caseItem.report_date}
                      </TableCell>
                      <TableCell className="font-medium">{caseItem.app_name}</TableCell>
                      <TableCell>{caseItem.app_developer || '-'}</TableCell>
                      <TableCell>{caseItem.department?.name || '-'}</TableCell>
                      <TableCell>{caseItem.platform?.name || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {caseItem.violation_summary || '-'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(caseItem)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          详情
                        </Button>
                        {caseItem.source_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={caseItem.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              原文
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCase?.app_name}</DialogTitle>
            <DialogDescription>案例详情</DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">通报日期</h4>
                <p className="text-sm text-muted-foreground">{selectedCase.report_date}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">开发者/运营者</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCase.app_developer || '-'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">监管部门</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCase.department?.name || '-'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">应用平台</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCase.platform?.name || '-'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">违规摘要</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCase.violation_summary || '-'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">详细违规内容</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedCase.violation_detail || '-'}
                </p>
              </div>
              {selectedCase.source_url && (
                <div>
                  <Button variant="outline" asChild>
                    <a
                      href={selectedCase.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      查看原文链接
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

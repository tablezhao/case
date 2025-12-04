import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNews } from '@/db/api';
import type { RegulatoryNewsWithDetails } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { ExternalLink, Eye, Calendar, Building2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

export default function NewsPage() {
  const navigate = useNavigate();
  const [news, setNews] = useState<RegulatoryNewsWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<RegulatoryNewsWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadNews();
  }, [page]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const result = await getNews(page, pageSize);
      setNews(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('加载资讯失败:', error);
      toast.error('加载资讯失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (newsItem: RegulatoryNewsWithDetails) => {
    setSelectedNews(newsItem);
    setDialogOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && page === 1) {
    return (
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl">监管资讯</CardTitle>
          <p className="text-sm text-muted-foreground">共 {total} 条资讯</p>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {/* 桌面端表格视图 */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发布日期</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>监管部门</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  news.map((newsItem) => (
                    <TableRow key={newsItem.id} className="hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap">
                        {newsItem.publish_date}
                      </TableCell>
                      <TableCell className="font-medium">
                        {newsItem.title}
                      </TableCell>
                      <TableCell>
                        {newsItem.department?.name ? (
                          <Badge variant="outline">{newsItem.department.name}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(newsItem)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </Button>
                        {newsItem.source_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={newsItem.source_url}
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

          {/* 移动端卡片视图 */}
          <div className="md:hidden space-y-3 px-4">
            {news.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                暂无数据
              </div>
            ) : (
              news.map((newsItem) => (
                <Card key={newsItem.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-base leading-snug flex-1">
                        {newsItem.title}
                      </h3>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {newsItem.publish_date}
                      </Badge>
                    </div>

                    {newsItem.department?.name && (
                      <Badge variant="secondary" className="text-xs">
                        {newsItem.department.name}
                      </Badge>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewDetail(newsItem)}
                        className="flex-1 min-h-[44px]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看详情
                      </Button>
                      {newsItem.source_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1 min-h-[44px]"
                        >
                          <a
                            href={newsItem.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            查看原文
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 px-4 sm:px-0">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                第 {page} / {totalPages} 页
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="min-h-[44px] min-w-[80px]"
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="min-h-[44px] min-w-[80px]"
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl leading-tight pr-8">
              {selectedNews?.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              监管资讯详细内容
            </DialogDescription>
          </DialogHeader>

          {selectedNews && (
            <div className="space-y-6 pt-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">发布日期：</span>
                  <span className="font-medium">{selectedNews.publish_date}</span>
                </div>
                {selectedNews.department && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">监管部门：</span>
                    <Badge variant="outline">{selectedNews.department.name}</Badge>
                  </div>
                )}
              </div>

              <Separator />

              {/* 详细内容 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">详细内容</h3>
                </div>
                <Card className="bg-muted/20 border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">
                        {selectedNews.content || '暂无详细内容'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 原文链接 */}
              {selectedNews.source_url && (
                <div className="flex justify-center pt-4">
                  <Button asChild variant="outline" className="gap-2">
                    <a
                      href={selectedNews.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      查看官方原文
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

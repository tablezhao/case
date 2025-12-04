import { useEffect, useState } from 'react';
import { getNews } from '@/db/api';
import type { RegulatoryNewsWithDetails } from '@/types/types';
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

export default function NewsPage() {
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
      <div className="container mx-auto p-6">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>监管资讯</CardTitle>
          <p className="text-sm text-muted-foreground">共 {total} 条资讯</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发布日期</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>监管部门</TableHead>
                  <TableHead>摘要</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  news.map((newsItem) => (
                    <TableRow key={newsItem.id}>
                      <TableCell className="whitespace-nowrap">
                        {newsItem.publish_date}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {newsItem.title}
                      </TableCell>
                      <TableCell>{newsItem.department?.name || '-'}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {newsItem.summary || '-'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(newsItem)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          详情
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
            <DialogTitle>{selectedNews?.title}</DialogTitle>
            <DialogDescription>资讯详情</DialogDescription>
          </DialogHeader>
          {selectedNews && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">发布日期</h4>
                <p className="text-sm text-muted-foreground">{selectedNews.publish_date}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">监管部门</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedNews.department?.name || '-'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">摘要</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedNews.summary || '-'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">详细内容</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedNews.content || '-'}
                </p>
              </div>
              {selectedNews.source_url && (
                <div>
                  <Button variant="outline" asChild>
                    <a
                      href={selectedNews.source_url}
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

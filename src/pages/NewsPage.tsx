import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNews } from '@/db/api';
import type { RegulatoryNewsWithDetails } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function NewsPage() {
  const navigate = useNavigate();
  const [news, setNews] = useState<RegulatoryNewsWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);

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

  const handleViewDetail = (newsId: string) => {
    navigate(`/news/${newsId}`);
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
          <CardTitle className="text-2xl">监管资讯</CardTitle>
          <p className="text-sm text-muted-foreground">共 {total} 条资讯</p>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {/* 桌面端表格视图 */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">发布日期</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead className="w-[200px]">监管部门</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  news.map((newsItem) => (
                    <TableRow 
                      key={newsItem.id} 
                      className="hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => handleViewDetail(newsItem.id)}
                    >
                      <TableCell className="whitespace-nowrap text-sm">
                        {newsItem.publish_date}
                      </TableCell>
                      <TableCell className="font-medium group-hover:text-primary transition-colors">
                        {newsItem.title}
                      </TableCell>
                      <TableCell>
                        {newsItem.department?.name ? (
                          <Badge variant="outline">{newsItem.department.name}</Badge>
                        ) : '-'}
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
                <Card 
                  key={newsItem.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewDetail(newsItem.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-base leading-snug flex-1 hover:text-primary transition-colors">
                        {newsItem.title}
                      </h3>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {newsItem.publish_date}
                      </Badge>
                    </div>

                    {newsItem.department?.name && (
                      <Badge className="text-xs bg-orange-500 hover:bg-orange-600">
                        {newsItem.department.name}
                      </Badge>
                    )}
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
    </div>
  );
}

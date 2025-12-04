import { useEffect, useState } from 'react';
import { getCases, getDepartments, getPlatforms } from '@/db/api';
import type { CaseWithDetails, RegulatoryDepartment, AppPlatform, CaseFilterParams } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ExternalLink, Eye, Search, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseWithDetails[]>([]);
  const [departments, setDepartments] = useState<RegulatoryDepartment[]>([]);
  const [platforms, setPlatforms] = useState<AppPlatform[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // 筛选条件
  const [filters, setFilters] = useState<CaseFilterParams>({
    startDate: '',
    endDate: '',
    departmentIds: [],
    platformIds: [],
  });

  // 临时筛选条件（用于表单）
  const [tempFilters, setTempFilters] = useState<{
    startDate: string;
    endDate: string;
    departmentId: string;
    platformId: string;
  }>({
    startDate: '',
    endDate: '',
    departmentId: '',
    platformId: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadCases();
  }, [page, filters]);

  const loadInitialData = async () => {
    try {
      const [depts, plats] = await Promise.all([
        getDepartments(),
        getPlatforms(),
      ]);
      setDepartments(depts);
      setPlatforms(plats);
    } catch (error) {
      console.error('加载基础数据失败:', error);
    }
  };

  const loadCases = async () => {
    try {
      setLoading(true);
      const result = await getCases(page, pageSize, 'report_date', 'desc', filters);
      setCases(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('加载案例失败:', error);
      toast.error('加载案例失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // 将临时筛选条件转换为实际筛选参数
    const newFilters: CaseFilterParams = {
      startDate: tempFilters.startDate || undefined,
      endDate: tempFilters.endDate || undefined,
      departmentIds: tempFilters.departmentId ? [tempFilters.departmentId] : undefined,
      platformIds: tempFilters.platformId ? [tempFilters.platformId] : undefined,
    };
    setFilters(newFilters);
    setPage(1); // 重置到第一页
  };

  const handleClearFilters = () => {
    setTempFilters({
      startDate: '',
      endDate: '',
      departmentId: '',
      platformId: '',
    });
    setFilters({
      startDate: '',
      endDate: '',
      departmentIds: [],
      platformIds: [],
    });
    setPage(1);
  };

  const handleViewDetail = (caseItem: CaseWithDetails) => {
    // 跳转到详情页
    navigate(`/cases/${caseItem.id}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  // 检查是否有活动的筛选条件
  const hasActiveFilters = filters.startDate || filters.endDate || 
    (filters.departmentIds && filters.departmentIds.length > 0) || 
    (filters.platformIds && filters.platformIds.length > 0);

  if (loading && page === 1 && cases.length === 0) {
    return (
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 max-w-7xl">
      <Card className="shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl sm:text-2xl">案例查询</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                共 {total} 条案例
                {hasActiveFilters && <span className="text-primary ml-2">（已筛选）</span>}
              </p>
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 min-h-[44px] w-full sm:w-auto"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? '隐藏筛选' : '显示筛选'}
            </Button>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="mt-4 p-3 sm:p-4 border rounded-lg bg-muted/30 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">开始日期</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={tempFilters.startDate}
                    onChange={(e) => setTempFilters({ ...tempFilters, startDate: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">结束日期</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={tempFilters.endDate}
                    onChange={(e) => setTempFilters({ ...tempFilters, endDate: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">监管部门</Label>
                  <Select
                    value={tempFilters.departmentId}
                    onValueChange={(value) => setTempFilters({ ...tempFilters, departmentId: value })}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="全部部门" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部部门</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">应用平台</Label>
                  <Select
                    value={tempFilters.platformId}
                    onValueChange={(value) => setTempFilters({ ...tempFilters, platformId: value })}
                  >
                    <SelectTrigger id="platform">
                      <SelectValue placeholder="全部平台" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部平台</SelectItem>
                      {platforms.map((plat) => (
                        <SelectItem key={plat.id} value={plat.id}>
                          {plat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleSearch} className="gap-2 min-h-[44px] flex-1 sm:flex-initial">
                  <Search className="w-4 h-4" />
                  查询
                </Button>
                <Button variant="outline" onClick={handleClearFilters} className="gap-2 min-h-[44px] flex-1 sm:flex-initial">
                  <X className="w-4 h-4" />
                  清空
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-0 sm:px-6">
          {/* 桌面端表格视图 */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>通报日期</TableHead>
                  <TableHead>应用名称</TableHead>
                  <TableHead>开发者/运营者</TableHead>
                  <TableHead>监管部门</TableHead>
                  <TableHead>应用平台</TableHead>
                  <TableHead>主要违规内容</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((caseItem) => (
                    <TableRow key={caseItem.id} className="hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap">
                        {caseItem.report_date}
                      </TableCell>
                      <TableCell className="font-medium">{caseItem.app_name}</TableCell>
                      <TableCell>{caseItem.app_developer || '-'}</TableCell>
                      <TableCell>
                        {caseItem.department?.name ? (
                          <Badge variant="outline">{caseItem.department.name}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {caseItem.platform?.name ? (
                          <Badge variant="secondary">{caseItem.platform.name}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="line-clamp-2">
                          {caseItem.violation_content || '-'}
                        </div>
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

          {/* 移动端卡片视图 */}
          <div className="md:hidden space-y-3 px-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                暂无数据
              </div>
            ) : (
              cases.map((caseItem) => (
                <Card key={caseItem.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-base leading-snug flex-1">
                        {caseItem.app_name}
                      </h3>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {caseItem.report_date}
                      </Badge>
                    </div>

                    {caseItem.app_developer && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">开发者：</span>
                        {caseItem.app_developer}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {caseItem.department?.name && (
                        <Badge variant="outline" className="text-xs">
                          {caseItem.department.name}
                        </Badge>
                      )}
                      {caseItem.platform?.name && (
                        <Badge variant="secondary" className="text-xs">
                          {caseItem.platform.name}
                        </Badge>
                      )}
                    </div>

                    {caseItem.violation_content && (
                      <div className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {caseItem.violation_content}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewDetail(caseItem)}
                        className="flex-1 min-h-[44px]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看详情
                      </Button>
                      {caseItem.source_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1 min-h-[44px]"
                        >
                          <a
                            href={caseItem.source_url}
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
    </div>
  );
}

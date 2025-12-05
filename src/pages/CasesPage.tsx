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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, X, Filter } from 'lucide-react';
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
  const [showFilters, setShowFilters] = useState(false);

  // 关键词搜索
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

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
  }, [page, filters, searchKeyword]);

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
      
      // 如果有搜索关键词，进行前端过滤
      let filteredData = result.data;
      if (searchKeyword.trim()) {
        const lowerKeyword = searchKeyword.toLowerCase().trim();
        filteredData = result.data.filter((caseItem) => {
          return (
            caseItem.app_name?.toLowerCase().includes(lowerKeyword) ||
            caseItem.app_developer?.toLowerCase().includes(lowerKeyword) ||
            caseItem.department?.name?.toLowerCase().includes(lowerKeyword) ||
            caseItem.platform?.name?.toLowerCase().includes(lowerKeyword) ||
            caseItem.violation_content?.toLowerCase().includes(lowerKeyword)
          );
        });
      }
      
      setCases(filteredData);
      setTotal(searchKeyword.trim() ? filteredData.length : result.total);
    } catch (error) {
      console.error('加载案例失败:', error);
      toast.error('加载案例失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordSearch = () => {
    setSearchKeyword(keyword);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleKeywordSearch();
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
    setKeyword('');
    setSearchKeyword('');
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
  const hasActiveFilters = searchKeyword || filters.startDate || filters.endDate || 
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
          <div className="flex flex-col gap-4">
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

            {/* 关键词搜索 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索应用名称、开发者、监管部门、违规内容..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-9 min-h-[44px]"
                />
              </div>
              <Button 
                onClick={handleKeywordSearch}
                className="gap-2 min-h-[44px]"
              >
                <Search className="w-4 h-4" />
                搜索
              </Button>
              {(keyword || searchKeyword) && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setKeyword('');
                    setSearchKeyword('');
                    setPage(1);
                  }}
                  className="gap-2 min-h-[44px]"
                  title="清空搜索"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* 筛选面板 */}
            {showFilters && (
              <div className="p-3 sm:p-4 border rounded-lg bg-muted/30 space-y-3 sm:space-y-4">
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
          </div>
        </CardHeader>

        <CardContent className="px-0 sm:px-6">
          {/* 桌面端表格视图 */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">通报日期</TableHead>
                  <TableHead className="w-[150px]">应用名称</TableHead>
                  <TableHead className="w-[140px]">开发者/运营者</TableHead>
                  <TableHead className="w-[180px]">监管部门</TableHead>
                  <TableHead className="w-[120px]">应用平台</TableHead>
                  <TableHead>主要违规内容</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((caseItem) => (
                    <TableRow 
                      key={caseItem.id} 
                      className="hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => handleViewDetail(caseItem)}
                    >
                      <TableCell className="whitespace-nowrap text-sm">
                        {caseItem.report_date}
                      </TableCell>
                      <TableCell className="font-medium text-sm group-hover:text-primary transition-colors">
                        <div className="line-clamp-2" title={caseItem.app_name}>
                          {caseItem.app_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="line-clamp-2" title={caseItem.app_developer || '-'}>
                          {caseItem.app_developer || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {caseItem.department?.name ? (
                          <Badge variant="outline" className="font-normal text-xs">
                            <div className="line-clamp-1" title={caseItem.department.name}>
                              {caseItem.department.name}
                            </div>
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {caseItem.platform?.name ? (
                          <Badge className="font-normal text-xs bg-orange-500 hover:bg-orange-600">
                            {caseItem.platform.name}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div 
                          className="line-clamp-2 text-sm text-muted-foreground leading-relaxed"
                          title={caseItem.violation_content || '-'}
                        >
                          {caseItem.violation_content || '-'}
                        </div>
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
                <Card 
                  key={caseItem.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewDetail(caseItem)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-base leading-snug flex-1 hover:text-primary transition-colors">
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
                        <Badge className="text-xs bg-orange-500 hover:bg-orange-600">
                          {caseItem.platform.name}
                        </Badge>
                      )}
                    </div>

                    {caseItem.violation_content && (
                      <div className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {caseItem.violation_content}
                      </div>
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

import { useEffect, useState } from 'react';
import { getCases, getDepartments, getPlatforms, generateSearchSuggestions } from '@/db/api';
import type { CaseWithDetails, RegulatoryDepartment, AppPlatform, CaseFilterParams } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// 文本截断函数：限制为25个字符
const truncateText = (text: string | null | undefined, maxLength: number = 25): string => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default function CasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseWithDetails[]>([]);
  const [departments, setDepartments] = useState<RegulatoryDepartment[]>([]);
  const [platforms, setPlatforms] = useState<AppPlatform[]>([]);
  const [total, setTotal] = useState(0);
  const [formattedTotal, setFormattedTotal] = useState('0');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 关键词搜索
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 筛选条件 - 直接使用，无需临时状态
  const [filters, setFilters] = useState<{
    dateRange: { from?: Date; to?: Date };
    departmentId: string;
    platformId: string;
  }>({
    dateRange: {},
    departmentId: '',
    platformId: '',
  });

  // 用于API调用的筛选参数
  const [apiFilters, setApiFilters] = useState<CaseFilterParams>({
    startDate: '',
    endDate: '',
    departmentIds: [],
    platformIds: [],
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  // 监听筛选条件变化，自动触发查询
  useEffect(() => {
    // 将filters转换为apiFilters
    const newApiFilters: CaseFilterParams = {
      startDate: filters.dateRange.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
      endDate: filters.dateRange.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
      departmentIds: filters.departmentId && filters.departmentId !== 'all' ? [filters.departmentId] : undefined,
      platformIds: filters.platformId && filters.platformId !== 'all' ? [filters.platformId] : undefined,
    };
    setApiFilters(newApiFilters);
    setPage(1); // 重置到第一页
  }, [filters]);

  useEffect(() => {
    loadCases();
  }, [page, apiFilters, searchKeyword]);
  
  // 监听搜索关键词变化，生成搜索建议
  useEffect(() => {
    if (keyword && keyword.length > 1) {
      const suggestions = generateSearchSuggestions(keyword);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [keyword]);

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
      
      // 使用全文搜索API
      const result = await getCases(
        page, 
        pageSize, 
        'report_date', 
        'desc', 
        apiFilters,
        searchKeyword // 传递关键词给后端全文搜索
      );
      
      setCases(Array.isArray(result.data) ? result.data : []);
      setTotal(result.total || 0);
      setFormattedTotal(result.formattedTotal || '0');
      
      // 显示友好的搜索或筛选结果提示
      if (searchKeyword && page === 1) {
        if (result.hasResults) {
          toast.success(`找到 ${result.total || 0} 条相关案例`);
        } else {
          toast.info('暂无匹配结果，尝试使用其他关键词或清除筛选条件');
        }
      } else if ((filters.dateRange.from || filters.departmentId || filters.platformId) && page === 1) {
        toast.success(`找到 ${result.total || 0} 条案例`);
      }
    } catch (error) {
      console.error('加载案例失败:', error);
      toast.error('加载案例失败，请稍后重试');
      // 网络异常时保留原有筛选条件
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleKeywordSearch = () => {
    if (!keyword.trim()) {
      setSearchKeyword('');
    } else {
      setSearching(true);
      setSearchKeyword(keyword);
      setShowSuggestions(false);
    }
    setPage(1);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setKeyword(suggestion);
    setSearchKeyword(suggestion);
    setShowSuggestions(false);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleKeywordSearch();
    }
  };

  const handleViewDetail = (caseItem: CaseWithDetails) => {
    // 跳转到详情页
    navigate(`/cases/${caseItem.id}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  // 检查是否有活动的筛选条件
  const hasActiveFilters = searchKeyword || filters.dateRange.from || filters.departmentId || filters.platformId;

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
                  共 {total} 条案例 ({searchKeyword ? `${formattedTotal} 条搜索结果` : ''})
                  {hasActiveFilters && <span className="text-primary ml-2">（已筛选）</span>}
                  {searching && <span className="ml-2 text-xs text-muted-foreground">搜索中...</span>}
                </p>
              </div>
            </div>

            {/* 关键词搜索 */}
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground">
                <Search className={searching ? "animate-pulse" : ""} />
              </div>
              <Input
                placeholder="搜索应用名称、开发者、监管部门、违规内容..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-9 pr-10 min-h-[44px]"
                disabled={searching}
              />
              {keyword && (
                <button
                  onClick={() => {
                    setKeyword('');
                    setSearchKeyword('');
                    setSearchSuggestions([]);
                    setShowSuggestions(false);
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-muted transition-colors"
                  aria-label="清空搜索"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* 搜索建议下拉框 */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <p className="px-3 py-1 text-xs text-muted-foreground bg-muted">搜索建议:</p>
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button 
              onClick={handleKeywordSearch}
              className="gap-2 min-h-[44px]"
              disabled={searching}
            >
              <Search className="w-4 h-4" />
              {searching ? '搜索中...' : '搜索'}
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

            {/* 筛选面板 - 常驻显示 */}
            <div className="p-3 sm:p-4 border rounded-lg bg-muted/30 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2 lg:col-span-1">
                  <Label>日期范围</Label>
                  <DateRangePicker
                    value={filters.dateRange}
                    onChange={(range) => setFilters({ ...filters, dateRange: range })}
                    placeholder="选择日期范围"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">监管部门</Label>
                  <Select
                    value={filters.departmentId}
                    onValueChange={(value) => setFilters({ ...filters, departmentId: value })}
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
                    value={filters.platformId}
                    onValueChange={(value) => setFilters({ ...filters, platformId: value })}
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
              
              {/* 加载状态提示 */}
              {loading && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  正在加载数据...
                </div>
              )}
            </div>
        </CardHeader>

        <CardContent className="px-0 sm:px-6">
          {/* 桌面端表格视图 */}
          <TooltipProvider delayDuration={300}>
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
                        <div title={caseItem.app_name}>
                          {truncateText(caseItem.app_name, 25)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div title={caseItem.app_developer || '-'}>
                          {truncateText(caseItem.app_developer, 25)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {caseItem.department?.name ? (
                          <Badge variant="outline" className="font-normal text-xs" title={caseItem.department.name}>
                            {truncateText(caseItem.department.name, 25)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {caseItem.platform?.name ? (
                          <Badge className="font-normal text-xs bg-orange-500 hover:bg-orange-600" title={caseItem.platform.name}>
                            {truncateText(caseItem.platform.name, 25)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className="text-sm text-muted-foreground leading-relaxed cursor-help"
                            >
                              {truncateText(caseItem.violation_content, 20)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            className="max-w-2xl w-[600px] p-4 bg-slate-50 border-slate-200 shadow-lg"
                            side="top"
                            align="start"
                          >
                            <div className="max-h-[400px] overflow-y-auto pr-2">
                              <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                                {caseItem.violation_content || '暂无违规内容'}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          </TooltipProvider>

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

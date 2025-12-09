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

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 获取违规级别样式
const getSeverityColorClass = (level: string) => {
  const map: {[key: string]: string} = {
    'high': 'bg-red-50 text-red-600 border border-red-200',
    'medium': 'bg-orange-50 text-orange-600 border border-orange-200',
    'low': 'bg-yellow-50 text-yellow-600 border border-yellow-200',
    'normal': 'bg-green-50 text-green-600 border border-green-200'
  };
  return map[level.toLowerCase()] || 'bg-gray-50 text-gray-600 border border-gray-200';
};

// 获取违规级别文本
const getSeverityText = (level: string) => {
  const map: {[key: string]: string} = {
    'high': '严重',
    'medium': '中等',
    'low': '轻微',
    'normal': '一般'
  };
  return map[level.toLowerCase()] || '未知';
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
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'completed' | 'no_results'>('idle');
  const [lastSearchInfo, setLastSearchInfo] = useState<{
    keyword: string | null;
    hasResults: boolean;
    suggestions: string[];
    queryTime: number;
  } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]); // 搜索历史

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
    setLoading(true);
    setSearchStatus('searching');
    setSearchError(null); // 清除之前的搜索错误
    try {
      // 使用全文搜索API
      const result = await getCases(
        page, 
        pageSize, 
        'report_date', 
        'desc', 
        apiFilters,
        searchKeyword // 传递关键词给后端全文搜索
      );
      
      // 更新案例数据
      setCases(Array.isArray(result.data) ? result.data : []);
      setTotal(result.total || 0);
      setFormattedTotal(result.formattedTotal || '0');
      
      // 更新搜索信息
      const currentSearchInfo = {
        keyword: result.searchKeyword || searchKeyword,
        hasResults: result.hasResults,
        suggestions: result.suggestions || [],
        queryTime: result.queryTime || 0
      };
      
      setLastSearchInfo(currentSearchInfo);
      
      // 更新搜索状态
      setSearchStatus(result.hasResults ? 'completed' : 'no_results');
      
      // 如果有搜索关键词且有结果，添加到搜索历史
      if (searchKeyword && result.hasResults) {
        addToSearchHistory(searchKeyword);
      }
      
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
      
      // 提供搜索反馈（如果查询时间较长）
      if (result.queryTime && result.queryTime > 500) {
        console.log(`搜索完成，用时 ${result.queryTime}ms`);
      }
    } catch (error) {
      console.error('加载案例失败:', error);
      // 添加明确的错误状态和用户反馈
      setSearchError('搜索过程中出现错误，请稍后再试');
      setSearchStatus('error');
      toast.error('加载案例失败，请稍后重试');
      // 清空结果
      setCases([]);
      setTotal(0);
      setFormattedTotal('0');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };
  
  // 添加搜索到历史记录
  const addToSearchHistory = (keyword: string) => {
    if (!keyword || keyword.trim().length === 0) return;
    
    setSearchHistory(prev => {
      // 移除重复项并添加到开头
      const newHistory = [keyword, ...prev.filter(item => item !== keyword)];
      // 限制历史记录数量
      return newHistory.slice(0, 10);
    });
  };

  // 搜索错误状态
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const handleKeywordSearch = () => {
    const trimmedKeyword = keyword.trim();
    
    if (!trimmedKeyword) {
      setSearchKeyword('');
      setSearchStatus('idle');
      setLastSearchInfo(null);
      setSearchError(null); // 清除错误状态
    } else {
      setSearching(true);
      setSearchStatus('searching');
      setSearchKeyword(trimmedKeyword);
      setShowSuggestions(false);
      setSearchError(null); // 清除之前的搜索错误
      
      // 记录搜索历史
      addToSearchHistory(trimmedKeyword);
    }
    setPage(1);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setKeyword(suggestion);
    setSearchKeyword(suggestion);
    setShowSuggestions(false);
    setPage(1);
    setSearchStatus('searching');
    
    // 记录搜索历史
    addToSearchHistory(suggestion);
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
              {/* 搜索状态指示器 */}
              {searchStatus === 'searching' && (
                <div className="text-sm text-blue-600 mb-1 flex items-center">
                  <div className="w-4 h-4 mr-1.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  正在搜索中...
                </div>
              )}
              
              {/* 搜索结果数量显示 */}
              {searchStatus === 'completed' && lastSearchInfo && lastSearchInfo.queryTime > 0 && (
                <div className="text-sm text-gray-600 mb-1 flex items-center">
                  找到 <span className="font-semibold text-primary">{formattedTotal}</span> 条结果 
                  {lastSearchInfo.queryTime > 0 && lastSearchInfo.keyword && (
                    <span className="text-xs text-gray-500 ml-2">({lastSearchInfo.queryTime}ms)</span>
                  )}
                </div>
              )}
              
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
                className={`pl-9 pr-10 min-h-[44px] ${
                  searchStatus === 'searching' ? 'border-blue-300' : 
                  searchStatus === 'no_results' ? 'border-red-300' : ''
                }`}
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
                    setSearchStatus('idle');
                    setLastSearchInfo(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-muted transition-colors"
                  aria-label="清空搜索"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* 搜索建议下拉框 - 增强版 */}
              {showSuggestions && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
                  {/* 搜索历史 */}
                  {searchHistory.length > 0 && !keyword && (
                    <div className="px-3 py-2 border-b border-border">
                      <div className="text-xs text-muted-foreground mb-1">搜索历史</div>
                      {searchHistory.slice(0, 3).map((item, index) => (
                        <button
                          key={`history-${index}`}
                          onClick={() => {
                            setKeyword(item);
                            setSearchKeyword(item);
                            handleKeywordSearch();
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-muted transition-colors text-sm flex items-center"
                        >
                          <svg className="w-3.5 h-3.5 mr-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* 智能搜索建议 */}
                  {searchSuggestions.length > 0 && (
                    <div className="px-3 py-2 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-1">搜索建议</div>
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-2 py-1.5 hover:bg-muted transition-colors text-sm flex items-center"
                        >
                          <svg className="w-3.5 h-3.5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                          </svg>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* 无建议提示 */}
                  {searchSuggestions.length === 0 && keyword && (
                    <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                      暂无搜索建议
                    </div>
                  )}
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
                    setSearchStatus('idle');
                    setLastSearchInfo(null);
                  }}
                  className="gap-2 min-h-[44px]"
                  title="清空搜索"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              
              {/* 搜索建议 - 无结果时显示 */}
              {searchStatus === 'no_results' && lastSearchInfo && lastSearchInfo.suggestions.length > 0 && lastSearchInfo.keyword && (
                <div className="mt-3 w-full max-w-3xl bg-blue-50 p-4 rounded-md border border-blue-200">
                  <div className="text-sm text-blue-700 font-medium mb-2">
                    <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    没有找到与 "{lastSearchInfo.keyword}" 相关的内容，试试这些关键词:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lastSearchInfo.suggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={index}
                        className="px-3 py-1 bg-white text-blue-600 rounded-full text-sm border border-blue-200 hover:bg-blue-100 transition-colors"
                        onClick={() => {
                          setKeyword(suggestion);
                          setSearchKeyword(suggestion);
                          handleKeywordSearch();
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 筛选面板 - 增强版 */}
            <div className="rounded-lg border shadow-sm overflow-hidden">
              {/* 筛选标题栏 */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted border-b">
                <h3 className="font-medium">筛选条件</h3>
                {(filters.dateRange.from || filters.departmentId || filters.platformId) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-primary hover:text-primary/80 h-auto py-1 px-2"
                    onClick={() => {
                      setFilters({
                        dateRange: {},
                        departmentId: '',
                        platformId: '',
                      });
                      setPage(1);
                    }}
                  >
                    清空筛选
                  </Button>
                )}
              </div>
              
              <div className="p-3 sm:p-4 space-y-4">
                {/* 活跃筛选条件标签 */}
                {(filters.dateRange.from || filters.departmentId || filters.platformId) && (
                  <div className="flex flex-wrap gap-2">
                    {(filters.dateRange.from || filters.dateRange.to) && (
                      <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                        日期: {(filters.dateRange.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : '不限')} - 
                        {(filters.dateRange.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : '不限')}
                        <button
                          className="ml-1 text-blue-400 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters(prev => ({ ...prev, dateRange: {} }));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.departmentId && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                        部门: {departments.find(d => d.id === filters.departmentId)?.name || '未知'}
                        <button
                          className="ml-1 text-green-400 hover:text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters(prev => ({ ...prev, departmentId: '' }));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.platformId && (
                      <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                        平台: {platforms.find(p => p.id === filters.platformId)?.name || '未知'}
                        <button
                          className="ml-1 text-purple-400 hover:text-purple-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters(prev => ({ ...prev, platformId: '' }));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* 筛选控件网格 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2 lg:col-span-1">
                    <Label className="text-sm font-medium">日期范围</Label>
                    <DateRangePicker
                      value={filters.dateRange}
                      onChange={(range) => setFilters({ ...filters, dateRange: range })}
                      placeholder="选择日期范围"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">监管部门</Label>
                    <Select
                      value={filters.departmentId}
                      onValueChange={(value) => setFilters({ ...filters, departmentId: value })}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="全部部门" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">全部部门</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform" className="text-sm font-medium">应用平台</Label>
                    <Select
                      value={filters.platformId}
                      onValueChange={(value) => setFilters({ ...filters, platformId: value })}
                    >
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="全部平台" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">全部平台</SelectItem>
                        {platforms.map((plat) => (
                          <SelectItem key={plat.id} value={plat.id}>
                            {plat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* 加载状态提示 */}
              {loading && (
                <div className="text-sm text-muted-foreground text-center py-2 border-t">
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
                {searchError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="p-6 bg-red-50 rounded-lg border border-red-200 max-w-md mx-auto">
                        <h3 className="text-lg font-medium text-red-800 mb-2">搜索失败</h3>
                        <p className="text-red-600 mb-4">{searchError}</p>
                        <button
                          onClick={() => {
                            setSearchError(null);
                            loadCases();
                          }}
                          className="px-4 py-2 bg-white text-red-700 border border-red-300 rounded hover:bg-red-100 transition-colors"
                        >
                          重试
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="p-6 bg-gray-50 rounded-lg text-center max-w-md mx-auto">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          {searchStatus === 'no_results' ? '未找到相关案例' : '暂无数据'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {searchStatus === 'no_results' ? '尝试使用其他关键词或修改筛选条件' : '暂无可用数据'}
                        </p>
                      </div>
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

          {/* 移动端卡片视图 - 增强版 */}
          <div className="md:hidden space-y-3 px-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 bg-white rounded-lg border border-gray-100">
                <div className="mb-2">暂无数据</div>
                {searchKeyword && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setKeyword('');
                      setSearchKeyword('');
                      setPage(1);
                      setSearchStatus('idle');
                      setLastSearchInfo(null);
                    }}
                    className="mt-2"
                  >
                    清除搜索条件
                  </Button>
                )}
              </div>
            ) : (
              cases.map((caseItem) => (
                <Card 
                  key={caseItem.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
                  onClick={() => handleViewDetail(caseItem)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-base leading-snug flex-1 hover:text-primary transition-colors">
                        {caseItem.app_name}
                      </h3>
                      <Badge className="text-xs bg-orange-500 hover:bg-orange-600 shrink-0">
                        {caseItem.platform?.name || '未知平台'}
                      </Badge>
                    </div>

                    {caseItem.app_developer && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"></path>
                        </svg>
                        <span className="font-medium">开发者：</span>
                        {caseItem.app_developer}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {caseItem.department?.name && (
                        <Badge variant="outline" className="text-xs border-gray-200 bg-gray-50">
                          {caseItem.department.name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {caseItem.report_date}
                      </Badge>
                    </div>

                    {caseItem.violation_content && (
                      <div className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {caseItem.violation_content}
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-2 border-t border-gray-50">
                      <div className="flex items-center text-primary text-sm hover:text-primary/80">
                        查看详情 
                        <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path>
                        </svg>
                      </div>
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

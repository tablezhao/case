import { useEffect, useState } from 'react';
import { getCases, createCase, updateCase, deleteCase, getDepartments, getPlatforms, createDepartment, createPlatform, batchCreateCasesWithDedup, batchDeleteCases, batchUpdateCases, smartImportCases, generateSearchSuggestions } from '@/db/api';
import type { CaseWithDetails, RegulatoryDepartment, AppPlatform, CaseFilterParams } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Upload, Download, ArrowLeft, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { CreatableCombobox } from '@/components/ui/creatable-combobox';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';

export default function CaseManagePage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseWithDetails[]>([]);
  const [departments, setDepartments] = useState<RegulatoryDepartment[]>([]);
  const [platforms, setPlatforms] = useState<AppPlatform[]>([]);
  const [total, setTotal] = useState(0);
  const [formattedTotal, setFormattedTotal] = useState('0');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchEditDialogOpen, setBatchEditDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseWithDetails | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 关键词搜索
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 筛选条件 - 直接使用，无需临时状态
  const [tempFilters, setTempFilters] = useState<{
    dateRange: { from?: Date; to?: Date };
    departmentId: string;
    platformId: string;
  }>({
    dateRange: {},
    departmentId: '',
    platformId: '',
  });

  // 用于API调用的筛选参数
  const [filters, setFilters] = useState<CaseFilterParams>({
    startDate: '',
    endDate: '',
    departmentIds: [],
    platformIds: [],
  });

  const [formData, setFormData] = useState({
    report_date: '',
    app_name: '',
    app_developer: '',
    department_id: '',
    platform_id: '',
    violation_content: '',
    source_url: '',
  });

  const [batchEditData, setBatchEditData] = useState({
    department_id: '',
    platform_id: '',
    violation_content: '',
    report_date: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  // 监听筛选条件变化，自动触发查询
  useEffect(() => {
    // 将tempFilters转换为filters
    const newFilters: CaseFilterParams = {
      startDate: tempFilters.dateRange.from ? format(tempFilters.dateRange.from, 'yyyy-MM-dd') : undefined,
      endDate: tempFilters.dateRange.to ? format(tempFilters.dateRange.to, 'yyyy-MM-dd') : undefined,
      departmentIds: tempFilters.departmentId && tempFilters.departmentId !== 'all' ? [tempFilters.departmentId] : undefined,
      platformIds: tempFilters.platformId && tempFilters.platformId !== 'all' ? [tempFilters.platformId] : undefined,
    };
    setFilters(newFilters);
    setPage(1); // 重置到第一页
  }, [tempFilters]);

  useEffect(() => {
    loadData();
  }, [page, filters, searchKeyword]);
  
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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 使用全文搜索API
      const casesResult = await getCases(
        page, 
        pageSize, 
        'report_date', 
        'desc', 
        filters,
        searchKeyword // 传递关键词给后端全文搜索
      );
      
      setCases(Array.isArray(casesResult.data) ? casesResult.data : []);
      setTotal(casesResult.total || 0);
      setFormattedTotal(casesResult.formattedTotal || '0');
      
      // 显示搜索结果提示
      if (tempFilters.dateRange.from || tempFilters.departmentId || tempFilters.platformId || searchKeyword) {
        if (casesResult.hasResults) {
          toast.success(`已找到 ${casesResult.total || 0} 条案例`);
        } else {
          toast.info('暂无匹配结果，尝试使用其他关键词或清除筛选条件');
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败，请检查网络连接');
      // 网络异常时保留原有筛选条件
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setKeyword(suggestion);
    setShowSuggestions(false);
    setSearchKeyword(suggestion);
    setPage(1);
  };

  const handleKeywordSearch = () => {
    setSearching(true);
    setShowSuggestions(false);
    setSearchKeyword(keyword);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleKeywordSearch();
    }
  };

  // 检查是否有活动的筛选条件
  const hasActiveFilters = searchKeyword || tempFilters.dateRange.from || tempFilters.departmentId || tempFilters.platformId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.report_date || !formData.app_name) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      if (editingCase) {
        await updateCase(editingCase.id, formData);
        toast.success('更新成功');
      } else {
        await createCase(formData);
        toast.success('创建成功');
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error('操作失败');
    }
  };

  const handleEdit = (caseItem: CaseWithDetails) => {
    setEditingCase(caseItem);
    setFormData({
      report_date: caseItem.report_date,
      app_name: caseItem.app_name,
      app_developer: caseItem.app_developer || '',
      department_id: caseItem.department_id || '',
      platform_id: caseItem.platform_id || '',
      violation_content: caseItem.violation_content || '',
      source_url: caseItem.source_url || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条案例吗？')) return;

    try {
      await deleteCase(id);
      toast.success('删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const resetForm = () => {
    setEditingCase(null);
    setFormData({
      report_date: '',
      app_name: '',
      app_developer: '',
      department_id: '',
      platform_id: '',
      violation_content: '',
      source_url: '',
    });
  };

  // 创建新部门
  const handleCreateDepartment = async (name: string): Promise<string> => {
    try {
      const newDept = await createDepartment({ 
        name,
        level: 'national', // 默认为国家级
        province: null,
      });
      if (!newDept) throw new Error('创建部门失败');
      
      // 重新加载部门列表
      const updatedDepts = await getDepartments();
      setDepartments(updatedDepts);
      
      toast.success(`成功创建监管部门：${name}（可在"部门与平台"模块中补充详细信息）`);
      return newDept.id;
    } catch (error) {
      console.error('创建部门失败:', error);
      toast.error('创建部门失败');
      throw error;
    }
  };

  // 创建新平台
  const handleCreatePlatform = async (name: string): Promise<string> => {
    try {
      const newPlat = await createPlatform({ name });
      if (!newPlat) throw new Error('创建平台失败');
      
      // 重新加载平台列表
      const updatedPlats = await getPlatforms();
      setPlatforms(updatedPlats);
      
      toast.success(`成功创建应用平台：${name}`);
      return newPlat.id;
    } catch (error) {
      console.error('创建平台失败:', error);
      toast.error('创建平台失败');
      throw error;
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(cases.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 单选
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的案例');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条案例吗？`)) return;

    try {
      await batchDeleteCases(selectedIds);
      toast.success(`成功删除 ${selectedIds.length} 条案例`);
      setSelectedIds([]);
      loadData();
    } catch (error) {
      console.error('批量删除失败:', error);
      toast.error('批量删除失败');
    }
  };

  // 批量修改
  const handleBatchEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedIds.length === 0) {
      toast.error('请先选择要修改的案例');
      return;
    }

    // 构建更新数据（只包含非空字段）
    const updateData: Partial<{ department_id: string; platform_id: string; violation_content: string; report_date: string }> = {};
    if (batchEditData.department_id) updateData.department_id = batchEditData.department_id;
    if (batchEditData.platform_id) updateData.platform_id = batchEditData.platform_id;
    if (batchEditData.violation_content) updateData.violation_content = batchEditData.violation_content;
    if (batchEditData.report_date) updateData.report_date = batchEditData.report_date;

    if (Object.keys(updateData).length === 0) {
      toast.error('请至少填写一个要修改的字段');
      return;
    }

    try {
      const updates = selectedIds.map(id => ({ id, data: updateData }));
      await batchUpdateCases(updates);
      toast.success(`成功修改 ${selectedIds.length} 条案例`);
      setBatchEditDialogOpen(false);
      setBatchEditData({ department_id: '', platform_id: '', violation_content: '', report_date: '' });
      setSelectedIds([]);
      loadData();
    } catch (error) {
      console.error('批量修改失败:', error);
      toast.error('批量修改失败');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 转换为智能导入所需的格式
      const rawData = jsonData.map((row: any) => ({
        report_date: row['通报日期'],
        app_name: row['应用名称'],
        app_developer: row['开发者/运营者'] || null,
        department_name: row['监管部门'] || '',
        platform_name: row['应用平台'] || '',
        violation_content: row['主要违规内容'] || row['违规摘要'] || null,
        source_url: row['原文链接'] || null,
      }));

      // 使用智能导入（自动创建不存在的部门和平台）
      const result = await smartImportCases(rawData);
      
      // 构建详细的成功消息
      let message = `✅ 成功导入 ${result.inserted} 条案例`;
      
      if (result.duplicatesRemoved > 0) {
        message += `\n🔄 去重 ${result.duplicatesRemoved} 条`;
      }
      
      if (result.createdDepartments > 0) {
        message += `\n🏢 新增监管部门 ${result.createdDepartments} 个：${result.newDepartments.join('、')}`;
      }
      
      if (result.createdPlatforms > 0) {
        message += `\n📱 新增应用平台 ${result.createdPlatforms} 个：${result.newPlatforms.join('、')}`;
      }
      
      toast.success(message, {
        duration: 6000,
      });
      
      loadData();
    } catch (error) {
      console.error('导入失败:', error);
      toast.error(error instanceof Error ? error.message : '导入失败');
    } finally {
      setLoading(false);
    }

    e.target.value = '';
  };

  const handleExport = () => {
    const exportData = cases.map(c => ({
      '通报日期': c.report_date,
      '应用名称': c.app_name,
      '开发者/运营者': c.app_developer || '',
      '监管部门': c.department?.name || '',
      '应用平台': c.platform?.name || '',
      '主要违规内容': c.violation_content || '',
      '原文链接': c.source_url || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '案例数据');
    XLSX.writeFile(workbook, '案例数据.xlsx');
  };

  // 导出全部案例数据
  const handleExportAllCases = async () => {
    setExportLoading(true);
    toast.info('正在获取全部案例数据，请稍候...');
    
    try {
      let allCases: CaseWithDetails[] = [];
      let currentPage = 1;
      const pageSize = 100; // 每页获取的数据量
      
      // 分批获取所有数据
      while (true) {
        const { data, total } = await getCases(currentPage, pageSize, 'report_date', 'desc');
        allCases = [...allCases, ...data];
        
        // 如果已经获取了所有数据，或者数据量小于请求的每页数量，则退出循环
        if (allCases.length >= total || data.length < pageSize) {
          break;
        }
        
        currentPage++;
      }
      
      // 转换数据格式
      const exportData = allCases.map(c => ({
        '通报日期': c.report_date,
        '应用名称': c.app_name,
        '开发者/运营者': c.app_developer || '',
        '监管部门': c.department?.name || '',
        '应用平台': c.platform?.name || '',
        '主要违规内容': c.violation_content || '',
        '原文链接': c.source_url || '',
      }));

      // 创建并下载Excel文件
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '全部案例数据');
      
      // 生成文件名（包含日期时间）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `全部案例数据_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      toast.success(`成功导出 ${allCases.length} 条案例数据`);
    } catch (error) {
      console.error('导出全部案例失败:', error);
      toast.error('导出失败，请重试');
    } finally {
      setExportLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const allSelected = cases.length > 0 && selectedIds.length === cases.length;

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* 顶部导航栏 */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">案例管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {total} 条案例
            {selectedIds.length > 0 && ` · 已选择 ${selectedIds.length} 条`}
            {searchKeyword && ` · ${formattedTotal} 条搜索结果`}
            {hasActiveFilters && <span className="text-primary ml-2">（已筛选）</span>}
            {searching && <span className="ml-2 text-xs text-muted-foreground">搜索中...</span>}
          </p>
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      <Card className="shadow-sm mb-6">
        <CardContent className="pt-6">
          {/* 关键词搜索 */}
          <div className="relative flex-1 mb-4">
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
            className="gap-2 min-h-[44px] mb-4"
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
            </CardContent>
          </Card>

          {/* 筛选面板 - 常驻显示 */}
          <Card className="p-0">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2 lg:col-span-1">
                  <Label>日期范围</Label>
                  <DateRangePicker
                    value={tempFilters.dateRange}
                    onChange={(range) => setTempFilters({ ...tempFilters, dateRange: range })}
                    placeholder="选择日期范围"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-department">监管部门</Label>
                  <Select
                    value={tempFilters.departmentId}
                    onValueChange={(value) => setTempFilters({ ...tempFilters, departmentId: value })}
                  >
                    <SelectTrigger id="filter-department">
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
                  <Label htmlFor="filter-platform">应用平台</Label>
                  <Select
                    value={tempFilters.platformId}
                    onValueChange={(value) => setTempFilters({ ...tempFilters, platformId: value })}
                  >
                    <SelectTrigger id="filter-platform">
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
            </CardContent>
          </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>案例列表</CardTitle>
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleBatchDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    批量删除
                  </Button>
                  <Dialog open={batchEditDialogOpen} onOpenChange={setBatchEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Pencil className="w-4 h-4 mr-2" />
                        批量修改
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>批量修改 ({selectedIds.length} 条案例)</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleBatchEdit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="batch_department_id">监管部门</Label>
                          <Select
                            value={batchEditData.department_id}
                            onValueChange={(value) => setBatchEditData({ ...batchEditData, department_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="不修改" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="batch_platform_id">应用平台</Label>
                          <Select
                            value={batchEditData.platform_id}
                            onValueChange={(value) => setBatchEditData({ ...batchEditData, platform_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="不修改" />
                            </SelectTrigger>
                            <SelectContent>
                              {platforms.map((plat) => (
                                <SelectItem key={plat.id} value={plat.id}>
                                  {plat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="batch_violation_content">主要违规内容</Label>
                          <Textarea
                            id="batch_violation_content"
                            value={batchEditData.violation_content}
                            onChange={(e) => setBatchEditData({ ...batchEditData, violation_content: e.target.value })}
                            placeholder="不修改"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="batch_report_date">通报日期</Label>
                          <Input
                            id="batch_report_date"
                            type="date"
                            value={batchEditData.report_date}
                            onChange={(e) => setBatchEditData({ ...batchEditData, report_date: e.target.value })}
                            placeholder="不修改"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setBatchEditDialogOpen(false)}>
                            取消
                          </Button>
                          <Button type="submit">
                            确认修改
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出当前页
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleExportAllCases}
                disabled={exportLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                {exportLoading ? '导出中...' : '导出全部案例'}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="w-4 h-4 mr-2" />
                  导入
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </Button>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    新增案例
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCase ? '编辑案例' : '新增案例'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="report_date">通报日期 *</Label>
                        <Input
                          id="report_date"
                          type="date"
                          value={formData.report_date}
                          onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app_name">应用名称 *</Label>
                        <Input
                          id="app_name"
                          value={formData.app_name}
                          onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="app_developer">开发者/运营者</Label>
                      <Input
                        id="app_developer"
                        value={formData.app_developer}
                        onChange={(e) => setFormData({ ...formData, app_developer: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department_id">监管部门</Label>
                        <CreatableCombobox
                          value={formData.department_id}
                          onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                          options={departments.map(d => ({ value: d.id, label: d.name }))}
                          placeholder="选择或新增监管部门"
                          emptyText="未找到匹配的部门"
                          onCreate={handleCreateDepartment}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="platform_id">应用平台</Label>
                        <CreatableCombobox
                          value={formData.platform_id}
                          onValueChange={(value) => setFormData({ ...formData, platform_id: value })}
                          options={platforms.map(p => ({ value: p.id, label: p.name }))}
                          placeholder="选择或新增应用平台"
                          emptyText="未找到匹配的平台"
                          onCreate={handleCreatePlatform}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="violation_content">主要违规内容 *</Label>
                      <Textarea
                        id="violation_content"
                        value={formData.violation_content}
                        onChange={(e) => setFormData({ ...formData, violation_content: e.target.value })}
                        rows={6}
                        placeholder="请输入主要违规内容"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="source_url">原文链接</Label>
                      <Input
                        id="source_url"
                        type="url"
                        value={formData.source_url}
                        onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        取消
                      </Button>
                      <Button type="submit">
                        {editingCase ? '更新' : '创建'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      className="w-5 h-5"
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">通报日期</TableHead>
                  <TableHead className="min-w-[180px]">应用名称</TableHead>
                  <TableHead className="w-[180px]">开发者/运营者</TableHead>
                  <TableHead className="w-[200px]">监管部门</TableHead>
                  <TableHead className="w-[160px]">应用平台</TableHead>
                  <TableHead className="w-[120px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((caseItem) => {
                    const isSelected = selectedIds.includes(caseItem.id);
                    return (
                      <TableRow 
                        key={caseItem.id}
                        className={`hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOne(caseItem.id, checked as boolean)}
                            className="w-5 h-5"
                          />
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{caseItem.report_date}</TableCell>
                        <TableCell className="font-medium text-sm">{caseItem.app_name}</TableCell>
                        <TableCell className="text-sm">{caseItem.app_developer || '-'}</TableCell>
                        <TableCell className="text-sm">{caseItem.department?.name || '-'}</TableCell>
                        <TableCell className="text-sm">{caseItem.platform?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(caseItem)}
                              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
                              title="编辑"
                            >
                              <Pencil className="w-[18px] h-[18px]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(caseItem.id)}
                              className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive"
                              title="删除"
                            >
                              <Trash2 className="w-[18px] h-[18px]" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
    </div>
  );
}

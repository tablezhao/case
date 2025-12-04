import { useEffect, useState } from 'react';
import { getCases, createCase, updateCase, deleteCase, getDepartments, getPlatforms, batchCreateCasesWithDedup, batchDeleteCases, batchUpdateCases } from '@/db/api';
import type { CaseWithDetails, RegulatoryDepartment, AppPlatform } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Upload, Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

export default function CaseManagePage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseWithDetails[]>([]);
  const [departments, setDepartments] = useState<RegulatoryDepartment[]>([]);
  const [platforms, setPlatforms] = useState<AppPlatform[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchEditDialogOpen, setBatchEditDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseWithDetails | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
  });

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [casesResult, depts, plats] = await Promise.all([
        getCases(page, pageSize),
        getDepartments(),
        getPlatforms(),
      ]);
      setCases(casesResult.data);
      setTotal(casesResult.total);
      setDepartments(depts);
      setPlatforms(plats);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

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
    const updateData: Partial<{ department_id: string; platform_id: string; violation_content: string }> = {};
    if (batchEditData.department_id) updateData.department_id = batchEditData.department_id;
    if (batchEditData.platform_id) updateData.platform_id = batchEditData.platform_id;
    if (batchEditData.violation_content) updateData.violation_content = batchEditData.violation_content;

    if (Object.keys(updateData).length === 0) {
      toast.error('请至少填写一个要修改的字段');
      return;
    }

    try {
      const updates = selectedIds.map(id => ({ id, data: updateData }));
      await batchUpdateCases(updates);
      toast.success(`成功修改 ${selectedIds.length} 条案例`);
      setBatchEditDialogOpen(false);
      setBatchEditData({ department_id: '', platform_id: '', violation_content: '' });
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const casesToImport = jsonData.map((row: any) => {
        const dept = departments.find(d => d.name === row['监管部门']);
        const plat = platforms.find(p => p.name === row['应用平台']);

        return {
          report_date: row['通报日期'],
          app_name: row['应用名称'],
          app_developer: row['开发者/运营者'] || null,
          department_id: dept?.id || null,
          platform_id: plat?.id || null,
          violation_content: row['主要违规内容'] || row['违规摘要'] || null,
          source_url: row['原文链接'] || null,
        };
      });

      // 使用带去重的导入函数
      const result = await batchCreateCasesWithDedup(casesToImport);
      toast.success(`成功导入 ${result.inserted} 条案例${result.duplicatesRemoved > 0 ? `，去重 ${result.duplicatesRemoved} 条` : ''}`);
      loadData();
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败');
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
          </p>
        </div>
      </div>

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
                导出
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
                        <Select
                          value={formData.department_id}
                          onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择监管部门" />
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
                        <Label htmlFor="platform_id">应用平台</Label>
                        <Select
                          value={formData.platform_id}
                          onValueChange={(value) => setFormData({ ...formData, platform_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择应用平台" />
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>通报日期</TableHead>
                  <TableHead>应用名称</TableHead>
                  <TableHead>监管部门</TableHead>
                  <TableHead>应用平台</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(caseItem.id)}
                          onCheckedChange={(checked) => handleSelectOne(caseItem.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>{caseItem.report_date}</TableCell>
                      <TableCell className="font-medium">{caseItem.app_name}</TableCell>
                      <TableCell>{caseItem.department?.name || '-'}</TableCell>
                      <TableCell>{caseItem.platform?.name || '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(caseItem)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(caseItem.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
    </div>
  );
}

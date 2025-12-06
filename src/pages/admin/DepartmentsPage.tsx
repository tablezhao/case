import { useEffect, useState } from 'react';
import { getDepartmentsWithStats, createDepartment, updateDepartment, deleteDepartment, getPlatforms, createPlatform, updatePlatform, deletePlatform } from '@/db/api';
import type { RegulatoryDepartment, AppPlatform } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ArrowLeft, FileText, AppWindow } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// 扩展部门类型以包含统计数据
interface DepartmentWithStats extends RegulatoryDepartment {
  case_count?: number;
  app_count?: number;
}

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [platforms, setPlatforms] = useState<AppPlatform[]>([]);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [platDialogOpen, setPlatDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentWithStats | null>(null);
  const [editingPlat, setEditingPlat] = useState<AppPlatform | null>(null);

  const [deptForm, setDeptForm] = useState({
    name: '',
    level: 'provincial' as 'national' | 'provincial',
    province: '',
  });

  const [platForm, setPlatForm] = useState({
    name: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [depts, plats] = await Promise.all([
        getDepartmentsWithStats(),
        getPlatforms(),
      ]);
      setDepartments(depts);
      setPlatforms(plats);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    }
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deptForm.name.trim()) {
      toast.error('请填写部门名称');
      return;
    }

    // 验证：省级部门必须有省份
    if (deptForm.level === 'provincial' && !deptForm.province.trim()) {
      toast.error('省级部门必须填写省份');
      return;
    }

    // 国家级部门不应该有省份，省级部门省份不能为空字符串
    const submitData = {
      name: deptForm.name.trim(),
      level: deptForm.level,
      province: deptForm.level === 'national' ? null : (deptForm.province.trim() || null),
    };

    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, submitData);
        toast.success('更新成功');
      } else {
        await createDepartment(submitData);
        toast.success('创建成功');
      }
      setDeptDialogOpen(false);
      resetDeptForm();
      loadData();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error('操作失败');
    }
  };

  const handlePlatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!platForm.name) {
      toast.error('请填写平台名称');
      return;
    }

    try {
      if (editingPlat) {
        await updatePlatform(editingPlat.id, platForm);
        toast.success('更新成功');
      } else {
        await createPlatform(platForm);
        toast.success('创建成功');
      }
      setPlatDialogOpen(false);
      resetPlatForm();
      loadData();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error('操作失败');
    }
  };

  const handleEditDept = (dept: RegulatoryDepartment) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      level: dept.level,
      province: dept.province || '',
    });
    setDeptDialogOpen(true);
  };

  const handleEditPlat = (plat: AppPlatform) => {
    setEditingPlat(plat);
    setPlatForm({ name: plat.name });
    setPlatDialogOpen(true);
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm('确定要删除这个部门吗？')) return;

    try {
      await deleteDepartment(id);
      toast.success('删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const handleDeletePlat = async (id: string) => {
    if (!confirm('确定要删除这个平台吗？')) return;

    try {
      await deletePlatform(id);
      toast.success('删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const resetDeptForm = () => {
    setEditingDept(null);
    setDeptForm({ name: '', level: 'provincial', province: '' });
  };

  const resetPlatForm = () => {
    setEditingPlat(null);
    setPlatForm({ name: '' });
  };

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
          <h1 className="text-2xl font-bold">部门与平台管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理监管部门和应用平台信息
          </p>
        </div>
      </div>

      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="departments">监管部门</TabsTrigger>
          <TabsTrigger value="platforms">应用平台</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>监管部门列表</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">共 {departments.length} 个部门</p>
                </div>
                <Dialog open={deptDialogOpen} onOpenChange={(open) => {
                  setDeptDialogOpen(open);
                  if (!open) resetDeptForm();
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      新增部门
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingDept ? '编辑部门' : '新增部门'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDeptSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dept_name">部门名称 *</Label>
                        <Input
                          id="dept_name"
                          value={deptForm.name}
                          onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="level">部门级别 *</Label>
                        <Select
                          value={deptForm.level}
                          onValueChange={(value: 'national' | 'provincial') => 
                            setDeptForm({ ...deptForm, level: value, province: value === 'national' ? '' : deptForm.province })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="national">国家级</SelectItem>
                            <SelectItem value="provincial">省级</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {deptForm.level === 'national' ? '国家级部门无需填写省份' : '省级部门必须填写省份'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">
                          省份 {deptForm.level === 'provincial' && '*'}
                        </Label>
                        <Input
                          id="province"
                          value={deptForm.province}
                          onChange={(e) => setDeptForm({ ...deptForm, province: e.target.value })}
                          disabled={deptForm.level === 'national'}
                          required={deptForm.level === 'provincial'}
                          placeholder={deptForm.level === 'national' ? '国家级无需填写' : '请输入省份'}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDeptDialogOpen(false)}>
                          取消
                        </Button>
                        <Button type="submit">
                          {editingDept ? '更新' : '创建'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>部门名称</TableHead>
                      <TableHead>级别</TableHead>
                      <TableHead>省份</TableHead>
                      <TableHead className="text-center">累计通报频次</TableHead>
                      <TableHead className="text-center">相关应用总数</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      departments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>
                            <Badge variant={dept.level === 'national' ? 'default' : 'secondary'}>
                              {dept.level === 'national' ? '国家级' : '省级'}
                            </Badge>
                          </TableCell>
                          <TableCell>{dept.province || '-'}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-semibold text-primary">
                                {dept.case_count || 0}
                              </span>
                              <span className="text-xs text-muted-foreground">次</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <AppWindow className="w-4 h-4 text-secondary-foreground" />
                              <span className="font-semibold text-secondary-foreground">
                                {dept.app_count || 0}
                              </span>
                              <span className="text-xs text-muted-foreground">个</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDept(dept)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDept(dept.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>应用平台列表</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">共 {platforms.length} 个平台</p>
                </div>
                <Dialog open={platDialogOpen} onOpenChange={(open) => {
                  setPlatDialogOpen(open);
                  if (!open) resetPlatForm();
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      新增平台
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingPlat ? '编辑平台' : '新增平台'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePlatSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="plat_name">平台名称 *</Label>
                        <Input
                          id="plat_name"
                          value={platForm.name}
                          onChange={(e) => setPlatForm({ name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setPlatDialogOpen(false)}>
                          取消
                        </Button>
                        <Button type="submit">
                          {editingPlat ? '更新' : '创建'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>平台名称</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {platforms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      platforms.map((plat) => (
                        <TableRow key={plat.id}>
                          <TableCell className="font-medium">{plat.name}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPlat(plat)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePlat(plat.id)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

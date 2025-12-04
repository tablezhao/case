import { useEffect, useState } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getPlatforms, createPlatform, updatePlatform, deletePlatform } from '@/db/api';
import type { RegulatoryDepartment, AppPlatform } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<RegulatoryDepartment[]>([]);
  const [platforms, setPlatforms] = useState<AppPlatform[]>([]);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [platDialogOpen, setPlatDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<RegulatoryDepartment | null>(null);
  const [editingPlat, setEditingPlat] = useState<AppPlatform | null>(null);

  const [deptForm, setDeptForm] = useState({
    name: '',
    province: '',
    city: '',
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
        getDepartments(),
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

    if (!deptForm.name) {
      toast.error('请填写部门名称');
      return;
    }

    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, deptForm);
        toast.success('更新成功');
      } else {
        await createDepartment(deptForm);
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
      province: dept.province || '',
      city: dept.city || '',
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
    setDeptForm({ name: '', province: '', city: '' });
  };

  const resetPlatForm = () => {
    setEditingPlat(null);
    setPlatForm({ name: '' });
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="departments">监管部门</TabsTrigger>
          <TabsTrigger value="platforms">应用平台</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>监管部门管理</CardTitle>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="province">省份</Label>
                          <Input
                            id="province"
                            value={deptForm.province}
                            onChange={(e) => setDeptForm({ ...deptForm, province: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">城市</Label>
                          <Input
                            id="city"
                            value={deptForm.city}
                            onChange={(e) => setDeptForm({ ...deptForm, city: e.target.value })}
                          />
                        </div>
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
                      <TableHead>省份</TableHead>
                      <TableHead>城市</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      departments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>{dept.province || '-'}</TableCell>
                          <TableCell>{dept.city || '-'}</TableCell>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>应用平台管理</CardTitle>
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

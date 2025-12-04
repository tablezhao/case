import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin } from 'lucide-react';
import { getNationalDepartments, getProvincialDepartments, getProvincesList } from '@/db/api';
import type { RegulatoryDepartment } from '@/types/types';
import { toast } from 'sonner';

export default function DepartmentsPage() {
  const [nationalDepts, setNationalDepts] = useState<RegulatoryDepartment[]>([]);
  const [provincialDepts, setProvincialDepts] = useState<RegulatoryDepartment[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProvincialDepartments();
  }, [selectedProvince]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [national, provinceList] = await Promise.all([
        getNationalDepartments(),
        getProvincesList(),
      ]);
      setNationalDepts(national);
      setProvinces(provinceList);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProvincialDepartments = async () => {
    try {
      const province = selectedProvince === 'all' ? undefined : selectedProvince;
      const depts = await getProvincialDepartments(province);
      setProvincialDepts(depts);
    } catch (error) {
      console.error('加载省级部门失败:', error);
      toast.error('加载省级部门失败');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">监管部门分布</h1>
        <p className="text-muted-foreground">
          查看国家级和省级监管部门信息
        </p>
      </div>

      <Tabs defaultValue="national" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="national">
            国家级部门
            <Badge variant="secondary" className="ml-2">
              {nationalDepts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="provincial">
            省级部门
            <Badge variant="secondary" className="ml-2">
              {provincialDepts.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="national" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              加载中...
            </div>
          ) : nationalDepts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                暂无国家级监管部门数据
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
              {nationalDepts.map((dept) => (
                <Card key={dept.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight">
                          {dept.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <Badge variant="default" className="text-xs">
                            国家级
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="provincial" className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium">选择省份：</label>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择省份" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部省份</SelectItem>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {provincialDepts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {selectedProvince === 'all' 
                  ? '暂无省级监管部门数据' 
                  : `${selectedProvince}暂无监管部门数据`}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
              {provincialDepts.map((dept) => (
                <Card key={dept.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight">
                          {dept.name}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            省级
                          </Badge>
                          {dept.province && (
                            <span className="text-xs">
                              {dept.province}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

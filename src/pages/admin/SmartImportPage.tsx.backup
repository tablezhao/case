import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/db/supabase';
import { createCase, getDepartments, getPlatforms } from '@/db/api';

interface ParsedCase {
  report_date: string | null;
  app_name: string | null;
  developer: string | null;
  department: string | null;
  platform: string | null;
  violation_summary: string | null;
  violation_detail: string | null;
  source_url: string;
  confidence: number;
  warnings: string[];
}

export default function SmartImportPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCase | null>(null);
  const [editedData, setEditedData] = useState<ParsedCase | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleParse = async () => {
    if (!url.trim()) {
      toast({
        title: '错误',
        description: '请输入网页URL',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setParsedData(null);
    setEditedData(null);
    setImportResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('parse-case-from-url', {
        body: { url: url.trim() },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        throw new Error(errorMsg || '解析失败');
      }

      if (!data.success) {
        throw new Error(data.error || '解析失败');
      }

      setParsedData(data.data);
      setEditedData(data.data);
      
      toast({
        title: '解析成功',
        description: `成功提取 ${Math.round(data.data.confidence * 100)}% 的字段`,
      });
    } catch (error: any) {
      console.error('解析错误:', error);
      toast({
        title: '解析失败',
        description: error.message || '无法解析网页内容',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!editedData) return;

    // 验证必填字段
    if (!editedData.app_name) {
      toast({
        title: '验证失败',
        description: '应用名称为必填项',
        variant: 'destructive',
      });
      return;
    }

    if (!editedData.report_date) {
      toast({
        title: '验证失败',
        description: '通报日期为必填项',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      // 获取部门和平台列表
      const [departments, platforms] = await Promise.all([
        getDepartments(),
        getPlatforms(),
      ]);

      // 查找或创建部门
      let departmentId: string | null = null;
      if (editedData.department) {
        const dept = departments.find(d => d.name === editedData.department);
        if (dept) {
          departmentId = dept.id;
        } else {
          // 这里可以自动创建部门，但为了简化，我们先设为null
          toast({
            title: '提示',
            description: `部门"${editedData.department}"不存在，将保存为空`,
          });
        }
      }

      // 查找或创建平台
      let platformId: string | null = null;
      if (editedData.platform) {
        const plat = platforms.find(p => p.name === editedData.platform);
        if (plat) {
          platformId = plat.id;
        } else {
          toast({
            title: '提示',
            description: `平台"${editedData.platform}"不存在，将保存为空`,
          });
        }
      }

      // 创建案例
      const newCase = await createCase({
        report_date: editedData.report_date!,
        app_name: editedData.app_name!,
        app_developer: editedData.developer || null,
        department_id: departmentId,
        platform_id: platformId,
        violation_summary: editedData.violation_summary || null,
        violation_detail: editedData.violation_detail || null,
        source_url: editedData.source_url,
      });

      // 生成执行报告
      const report = {
        operation: 'create',
        success: true,
        case_id: newCase.id,
        extracted_fields: [
          { field: '应用名称', value: editedData.app_name, confidence: editedData.app_name ? 1 : 0 },
          { field: '通报日期', value: editedData.report_date, confidence: editedData.report_date ? 1 : 0 },
          { field: '开发者', value: editedData.developer, confidence: editedData.developer ? 0.8 : 0 },
          { field: '监管部门', value: editedData.department, confidence: departmentId ? 1 : 0.5 },
          { field: '应用平台', value: editedData.platform, confidence: platformId ? 1 : 0.5 },
          { field: '违规摘要', value: editedData.violation_summary, confidence: editedData.violation_summary ? 0.9 : 0 },
          { field: '详细内容', value: editedData.violation_detail ? '已提取' : null, confidence: editedData.violation_detail ? 0.8 : 0 },
        ],
        warnings: parsedData?.warnings || [],
        timestamp: new Date().toISOString(),
      };

      setImportResult(report);

      toast({
        title: '导入成功',
        description: '案例已成功保存到数据库',
      });
    } catch (error: any) {
      console.error('导入错误:', error);
      toast({
        title: '导入失败',
        description: error.message || '无法保存案例',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-600">高</Badge>;
    if (confidence >= 0.5) return <Badge className="bg-yellow-600">中</Badge>;
    return <Badge variant="destructive">低</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            智能案例导入
          </h1>
          <p className="text-muted-foreground mt-1">AI自动解析监管通报网页，提取案例信息</p>
        </div>
      </div>

      {/* URL输入区域 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>步骤1：输入网页URL</CardTitle>
          <CardDescription>输入监管部门发布的通报案例网页地址</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="url">网页地址</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.gov.cn/notice/12345"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleParse} disabled={loading || !url.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    开始解析
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 解析结果预览 */}
      {parsedData && editedData && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>步骤2：检查并编辑数据</CardTitle>
                <CardDescription>AI已自动提取以下信息，请检查并修改</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">置信度：</span>
                <span className={`text-lg font-bold ${getConfidenceColor(parsedData.confidence)}`}>
                  {Math.round(parsedData.confidence * 100)}%
                </span>
                {getConfidenceBadge(parsedData.confidence)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 警告信息 */}
            {parsedData.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">解析警告：</div>
                  <ul className="list-disc list-inside space-y-1">
                    {parsedData.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* 编辑表单 */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <Label htmlFor="app_name">应用名称 *</Label>
                <Input
                  id="app_name"
                  value={editedData.app_name || ''}
                  onChange={(e) => setEditedData({ ...editedData, app_name: e.target.value })}
                  placeholder="请输入应用名称"
                />
              </div>

              <div>
                <Label htmlFor="report_date">通报日期 *</Label>
                <Input
                  id="report_date"
                  type="date"
                  value={editedData.report_date || ''}
                  onChange={(e) => setEditedData({ ...editedData, report_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="developer">开发者/运营者</Label>
                <Input
                  id="developer"
                  value={editedData.developer || ''}
                  onChange={(e) => setEditedData({ ...editedData, developer: e.target.value })}
                  placeholder="请输入开发者名称"
                />
              </div>

              <div>
                <Label htmlFor="department">监管部门</Label>
                <Input
                  id="department"
                  value={editedData.department || ''}
                  onChange={(e) => setEditedData({ ...editedData, department: e.target.value })}
                  placeholder="请输入监管部门"
                />
              </div>

              <div>
                <Label htmlFor="platform">应用平台</Label>
                <Input
                  id="platform"
                  value={editedData.platform || ''}
                  onChange={(e) => setEditedData({ ...editedData, platform: e.target.value })}
                  placeholder="请输入应用平台"
                />
              </div>

              <div>
                <Label htmlFor="source_url">原文链接</Label>
                <div className="flex gap-2">
                  <Input
                    id="source_url"
                    value={editedData.source_url}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(editedData.source_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="violation_summary">违规问题摘要</Label>
              <Textarea
                id="violation_summary"
                value={editedData.violation_summary || ''}
                onChange={(e) => setEditedData({ ...editedData, violation_summary: e.target.value })}
                placeholder="请输入违规问题摘要"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="violation_detail">详细违规内容</Label>
              <Textarea
                id="violation_detail"
                value={editedData.violation_detail || ''}
                onChange={(e) => setEditedData({ ...editedData, violation_detail: e.target.value })}
                placeholder="请输入详细违规内容"
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setParsedData(null);
                  setEditedData(null);
                  setImportResult(null);
                }}
              >
                取消
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    确认导入
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 执行报告 */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              执行报告
            </CardTitle>
            <CardDescription>案例导入操作已完成</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <Label>操作类型</Label>
                <div className="text-lg font-semibold">
                  {importResult.operation === 'create' ? '创建新案例' : '更新案例'}
                </div>
              </div>
              <div>
                <Label>案例ID</Label>
                <div className="text-sm font-mono text-muted-foreground">{importResult.case_id}</div>
              </div>
            </div>

            <div>
              <Label>提取字段统计</Label>
              <div className="mt-2 space-y-2">
                {importResult.extracted_fields.map((field: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-medium">{field.field}</span>
                    <div className="flex items-center gap-2">
                      {field.value ? (
                        <>
                          <span className="text-sm text-muted-foreground max-w-xs truncate">
                            {field.value}
                          </span>
                          <Badge variant="outline" className="text-green-600">
                            ✓
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          未提取
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {importResult.warnings.length > 0 && (
              <div>
                <Label>警告信息</Label>
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {importResult.warnings.map((warning: string, index: number) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => navigate('/admin/cases')}>
                查看案例列表
              </Button>
              <Button onClick={() => {
                setUrl('');
                setParsedData(null);
                setEditedData(null);
                setImportResult(null);
              }}>
                继续导入
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      {!parsedData && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">功能介绍</h3>
              <p className="text-sm text-muted-foreground">
                智能案例导入功能使用AI技术自动解析监管部门官网发布的通报案例，
                提取关键信息并生成结构化数据，大幅提升数据录入效率。
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">操作步骤</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>复制监管通报网页的完整URL地址</li>
                <li>粘贴到上方输入框，点击"开始解析"</li>
                <li>等待AI分析网页内容（通常需要10-30秒）</li>
                <li>检查提取的数据，修改不准确的字段</li>
                <li>点击"确认导入"保存到数据库</li>
                <li>查看执行报告，确认导入结果</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">注意事项</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>仅支持HTTP/HTTPS协议的网页</li>
                <li>建议使用政府官网发布的正式通报</li>
                <li>AI提取的数据可能不完全准确，请仔细检查</li>
                <li>必填字段：应用名称、通报日期</li>
                <li>如果部门或平台不存在，需要先在"部门与平台"中创建</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

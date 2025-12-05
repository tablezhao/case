import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle, CheckCircle2, ArrowLeft, ExternalLink, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/db/supabase';
import { createCase, getDepartments, getPlatforms, createDepartment, createPlatform } from '@/db/api';

interface ParsedCase {
  report_date: string | null;
  app_name: string | null;
  developer: string | null;
  department: string | null;
  platform: string | null;
  violation_content: string | null;
  source_url: string | null;
  confidence: number;
  warnings: string[];
  input_type: string;
}

type InputType = 'url' | 'text' | 'image' | 'pdf';

export default function SmartImportPage() {
  const [activeTab, setActiveTab] = useState<InputType>('url');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCase | null>(null);
  const [editedData, setEditedData] = useState<ParsedCase | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = async (file: File) => {
    // 验证文件类型
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      toast({
        title: '文件类型错误',
        description: '仅支持图片（JPG、PNG）和PDF文件',
        variant: 'destructive',
      });
      return;
    }
    
    // 验证文件大小
    const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: '文件过大',
        description: `文件大小不能超过${isPdf ? '10MB' : '5MB'}`,
        variant: 'destructive',
      });
      return;
    }
    
    setUploadedFile(file);
    
    // 上传到Supabase Storage
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `temp/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('temp-uploads')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from('temp-uploads')
        .getPublicUrl(filePath);
      
      setFileUrl(publicUrl);
      
      toast({
        title: '上传成功',
        description: '文件已上传，可以开始解析',
      });
    } catch (error: any) {
      console.error('上传错误:', error);
      toast({
        title: '上传失败',
        description: error.message || '无法上传文件',
        variant: 'destructive',
      });
    }
  };

  const handleParse = async () => {
    let content = '';
    
    // 根据当前Tab获取输入内容
    switch (activeTab) {
      case 'url':
        if (!urlInput.trim()) {
          toast({
            title: '错误',
            description: '请输入网页URL',
            variant: 'destructive',
          });
          return;
        }
        content = urlInput.trim();
        break;
        
      case 'text':
        if (!textInput.trim()) {
          toast({
            title: '错误',
            description: '请输入文本内容',
            variant: 'destructive',
          });
          return;
        }
        content = textInput.trim();
        break;
        
      case 'image':
      case 'pdf':
        if (!fileUrl) {
          toast({
            title: '错误',
            description: '请先上传文件',
            variant: 'destructive',
          });
          return;
        }
        content = fileUrl;
        break;
    }

    setLoading(true);
    setParsedData(null);
    setEditedData(null);
    setImportResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('parse-multimodal-case', {
        body: { 
          type: activeTab,
          content: content
        },
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
        description: error.message || '无法解析内容',
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

      const createdItems: string[] = [];

      // 查找或创建部门
      let departmentId: string | null = null;
      if (editedData.department) {
        const dept = departments.find(d => d.name === editedData.department);
        if (dept) {
          departmentId = dept.id;
        } else {
          // 自动创建新部门
          try {
            const newDept = await createDepartment({
              name: editedData.department,
              level: 'national',
              province: null,
            });
            if (newDept) {
              departmentId = newDept.id;
              createdItems.push(`监管部门"${editedData.department}"`);
            }
          } catch (error) {
            console.error('创建部门失败:', error);
            toast({
              title: '创建部门失败',
              description: `无法创建部门"${editedData.department}"`,
              variant: 'destructive',
            });
          }
        }
      }

      // 查找或创建平台
      let platformId: string | null = null;
      if (editedData.platform) {
        const plat = platforms.find(p => p.name === editedData.platform);
        if (plat) {
          platformId = plat.id;
        } else {
          // 自动创建新平台
          try {
            const newPlat = await createPlatform({
              name: editedData.platform,
            });
            if (newPlat) {
              platformId = newPlat.id;
              createdItems.push(`应用平台"${editedData.platform}"`);
            }
          } catch (error) {
            console.error('创建平台失败:', error);
            toast({
              title: '创建平台失败',
              description: `无法创建平台"${editedData.platform}"`,
              variant: 'destructive',
            });
          }
        }
      }

      // 创建案例
      const newCase = await createCase({
        report_date: editedData.report_date!,
        app_name: editedData.app_name!,
        app_developer: editedData.developer || null,
        department_id: departmentId,
        platform_id: platformId,
        violation_content: editedData.violation_content || null,
        source_url: editedData.source_url,
      });

      // 生成执行报告
      const report = {
        operation: 'create',
        success: true,
        case_id: newCase.id,
        input_type: editedData.input_type,
        extracted_fields: [
          { field: '应用名称', value: editedData.app_name, confidence: editedData.app_name ? 1 : 0 },
          { field: '通报日期', value: editedData.report_date, confidence: editedData.report_date ? 1 : 0 },
          { field: '开发者', value: editedData.developer, confidence: editedData.developer ? 0.8 : 0 },
          { field: '监管部门', value: editedData.department, confidence: departmentId ? 1 : 0.5 },
          { field: '应用平台', value: editedData.platform, confidence: platformId ? 1 : 0.5 },
          { field: '主要违规内容', value: editedData.violation_content, confidence: editedData.violation_content ? 0.9 : 0 },
        ],
        warnings: parsedData?.warnings || [],
        timestamp: new Date().toISOString(),
      };

      setImportResult(report);

      // 构建成功消息
      let successMessage = '案例已成功保存到数据库';
      if (createdItems.length > 0) {
        successMessage += `\n\n已自动创建：${createdItems.join('、')}`;
      }

      toast({
        title: '导入成功',
        description: successMessage,
      });
      
      // 清理临时文件
      if (fileUrl && (activeTab === 'image' || activeTab === 'pdf')) {
        const filePath = fileUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('temp-uploads').remove([filePath]);
      }
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

  const resetForm = () => {
    setUrlInput('');
    setTextInput('');
    setUploadedFile(null);
    setFileUrl('');
    setParsedData(null);
    setEditedData(null);
    setImportResult(null);
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

  const getInputTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      url: 'URL输入',
      text: '文本输入',
      image: '图片上传',
      pdf: 'PDF上传'
    };
    return labels[type] || type;
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            智能案例导入
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            支持URL、文本、图片、PDF多种输入方式
          </p>
        </div>
      </div>

      {/* 输入区域 */}
      <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>步骤1：选择输入方式并提供内容</CardTitle>
          <CardDescription>支持网页URL、文本描述、图片截图、PDF文档</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InputType)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="url">🌐 URL输入</TabsTrigger>
              <TabsTrigger value="text">📝 文本输入</TabsTrigger>
              <TabsTrigger value="image">🖼️ 图片上传</TabsTrigger>
              <TabsTrigger value="pdf">📄 PDF上传</TabsTrigger>
            </TabsList>

            {/* URL输入 */}
            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="url">网页地址</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.gov.cn/notice/12345"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  输入监管部门发布的通报案例网页地址
                </p>
              </div>
            </TabsContent>

            {/* 文本输入 */}
            <TabsContent value="text" className="space-y-4">
              <div>
                <Label htmlFor="text">文本内容</Label>
                <Textarea
                  id="text"
                  placeholder="粘贴或输入案例文本内容，例如：工业和信息化部于2024年1月15日发布通报，某某App（开发者：XX科技有限公司）在应用宝平台存在超范围收集个人信息的问题..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={loading}
                  rows={8}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  直接粘贴案例文本内容，AI将自动提取关键信息
                </p>
              </div>
            </TabsContent>

            {/* 图片上传 */}
            <TabsContent value="image" className="space-y-4">
              <div>
                <Label>上传图片</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  {uploadedFile && uploadedFile.type.startsWith('image/') ? (
                    <div className="space-y-4">
                      <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadedFile(null);
                          setFileUrl('');
                        }}
                      >
                        重新上传
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="font-medium">拖拽图片到此处或点击上传</p>
                        <p className="text-sm text-muted-foreground">
                          支持JPG、PNG格式，最大5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        选择图片
                      </Button>
                    </div>
                  )}
                </div>
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>当前版本限制：</strong>图片上传功能暂不支持自动OCR识别，
                    系统会提示您根据图片内容手动填写信息。完整的图像理解功能将在后续版本中提供。
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            {/* PDF上传 */}
            <TabsContent value="pdf" className="space-y-4">
              <div>
                <Label>上传PDF</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  {uploadedFile && uploadedFile.type === 'application/pdf' ? (
                    <div className="space-y-4">
                      <FileText className="w-12 h-12 text-primary mx-auto" />
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadedFile(null);
                          setFileUrl('');
                        }}
                      >
                        重新上传
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="font-medium">拖拽PDF到此处或点击上传</p>
                        <p className="text-sm text-muted-foreground">
                          支持PDF格式，最大10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                        id="pdf-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('pdf-upload')?.click()}
                      >
                        选择PDF
                      </Button>
                    </div>
                  )}
                </div>
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>当前版本限制：</strong>PDF上传功能暂不支持自动解析，
                    系统会提示您根据PDF内容手动填写信息。完整的PDF解析功能将在后续版本中提供。
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleParse} disabled={loading} size="lg">
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
        </CardContent>
      </Card>

      {/* 解析结果预览 */}
      {parsedData && editedData && (
        <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>步骤2：检查并编辑数据</CardTitle>
                <CardDescription>
                  AI已通过{getInputTypeLabel(parsedData.input_type)}自动提取以下信息，请检查并修改
                </CardDescription>
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

              {editedData.source_url && (
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
                      onClick={() => window.open(editedData.source_url!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="violation_content">主要违规内容</Label>
              <Textarea
                id="violation_content"
                value={editedData.violation_content || ''}
                onChange={(e) => setEditedData({ ...editedData, violation_content: e.target.value })}
                placeholder="请输入主要违规内容"
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
        <Card className="shadow-sm hover:shadow-md transition-shadow">
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
                <Label>输入方式</Label>
                <div className="text-lg font-semibold">
                  {getInputTypeLabel(importResult.input_type)}
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
              <Button onClick={resetForm}>
                继续导入
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      {!parsedData && !loading && (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">多模态输入支持</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">🌐 URL输入</h4>
                  <p className="text-sm text-muted-foreground">
                    输入监管部门官网的通报案例网页地址，系统自动抓取并解析内容。
                    适用于在线发布的通报案例。
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">📝 文本输入</h4>
                  <p className="text-sm text-muted-foreground">
                    直接粘贴或输入案例文本内容，AI自动提取关键信息。
                    适用于复制的文本内容或手动输入的描述。
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">🖼️ 图片上传</h4>
                  <p className="text-sm text-muted-foreground">
                    上传通报案例的截图或照片。当前版本需要手动填写信息，
                    未来将支持OCR自动识别。
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">📄 PDF上传</h4>
                  <p className="text-sm text-muted-foreground">
                    上传PDF格式的通报文档。当前版本需要手动填写信息，
                    未来将支持自动解析PDF内容。
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">操作步骤</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>选择合适的输入方式（URL、文本、图片或PDF）</li>
                <li>提供相应的内容或上传文件</li>
                <li>点击"开始解析"按钮</li>
                <li>等待AI分析处理（10-30秒）</li>
                <li>检查提取的数据，修改不准确的字段</li>
                <li>点击"确认导入"保存到数据库</li>
                <li>查看执行报告，确认导入结果</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">注意事项</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>URL输入：仅支持HTTP/HTTPS协议的网页</li>
                <li>文本输入：建议包含完整的案例信息</li>
                <li>图片上传：支持JPG、PNG格式，最大5MB</li>
                <li>PDF上传：支持PDF格式，最大10MB</li>
                <li>必填字段：应用名称、通报日期</li>
                <li>AI提取的数据可能不完全准确，请仔细检查</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

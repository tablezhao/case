import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Split } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';

// 模拟拆分函数（与数据库逻辑保持一致）
const splitViolationText = (text: string): string[] => {
  if (!text || text.trim() === '') {
    return [];
  }

  // 按中文分号拆分
  const parts = text.split('；');
  
  // 清理空白字符并过滤空字符串
  return parts
    .map(part => part.trim())
    .filter(part => part.length > 0);
};

// 示例数据
const exampleTexts = [
  '超范围收集个人信息；SDK信息公示不到位',
  '违规收集个人信息；APP强制、频繁、过度索取权限',
  '违规收集个人信息',
  'APP强制、频繁、过度索取权限；超范围收集个人信息；违规使用个人信息',
  '欺骗误导用户下载APP；应用分发平台管理责任落实不到位',
];

export default function ParseTestPage() {
  const [inputText, setInputText] = useState('');
  const [parsedResults, setParsedResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  // 执行解析
  const handleParse = () => {
    const results = splitViolationText(inputText);
    setParsedResults(results);
    setShowResults(true);
  };

  // 加载示例
  const loadExample = (example: string) => {
    setInputText(example);
    setShowResults(false);
  };

  // 清空
  const handleClear = () => {
    setInputText('');
    setParsedResults([]);
    setShowResults(false);
  };

  return (
    <>
      <PageMeta 
        title="违规问题解析测试 - 管理后台"
        description="测试违规问题文本的语义拆分效果"
      />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">违规问题解析测试</h1>
            <p className="text-muted-foreground mt-2">
              测试复合违规描述的智能拆分功能，验证语义解析效果
            </p>
          </div>
        </div>

        {/* 功能说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              功能说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p><strong>拆分规则：</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>按中文分号"；"拆分复合问题描述</li>
                <li>自动清理每个拆分项的前后空白字符</li>
                <li>过滤空字符串，确保结果有效</li>
                <li>保留顿号"、"等其他标点，不进行二次拆分</li>
              </ul>
              <p className="mt-3"><strong>应用场景：</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>高频问题统计：拆分后的每个独立问题作为最小统计单元</li>
                <li>问题分类分析：便于对单一问题进行归类和趋势分析</li>
                <li>数据质量提升：确保统计结果更精准、更有价值</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 示例快速加载 */}
        <Card>
          <CardHeader>
            <CardTitle>示例文本</CardTitle>
            <CardDescription>点击下方示例快速加载测试文本</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {exampleTexts.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => loadExample(example)}
                  className="text-xs"
                >
                  示例 {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle>输入测试文本</CardTitle>
            <CardDescription>
              输入或粘贴需要测试的违规问题描述文本
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-text">违规问题文本</Label>
              <Textarea
                id="input-text"
                placeholder="例如：超范围收集个人信息；SDK信息公示不到位"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleParse}
                disabled={!inputText.trim()}
                className="flex items-center gap-2"
              >
                <Split className="h-4 w-4" />
                执行解析
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
              >
                清空
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 解析结果 */}
        {showResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                解析结果
              </CardTitle>
              <CardDescription>
                共拆分为 {parsedResults.length} 个独立问题
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsedResults.length > 0 ? (
                <div className="space-y-3">
                  {parsedResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30"
                    >
                      <Badge variant="secondary" className="mt-0.5">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{result}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          字符数：{result.length}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>未能解析出有效的问题项</p>
                  <p className="text-sm mt-1">请检查输入文本是否包含有效内容</p>
                </div>
              )}

              {/* 统计信息 */}
              {parsedResults.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-sm mb-2">统计信息</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">原始文本长度</p>
                      <p className="font-semibold">{inputText.length} 字符</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">拆分项数量</p>
                      <p className="font-semibold">{parsedResults.length} 项</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">最长问题</p>
                      <p className="font-semibold">
                        {Math.max(...parsedResults.map(r => r.length))} 字符
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">最短问题</p>
                      <p className="font-semibold">
                        {Math.min(...parsedResults.map(r => r.length))} 字符
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 技术说明 */}
        <Card>
          <CardHeader>
            <CardTitle>技术实现说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-2">数据库层面</h4>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>使用PostgreSQL的string_to_array函数按分号拆分</li>
                <li>使用unnest展开数组为多行记录</li>
                <li>使用TRIM清理空白字符</li>
                <li>使用WHERE过滤空字符串</li>
                <li>重新统计每个独立问题的频次</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">前端展示</h4>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>API接口保持不变，确保兼容性</li>
                <li>饼图和表格自动展示拆分后的独立问题</li>
                <li>统计数据更精准，分析价值更高</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">注意事项</h4>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>当前仅按中文分号"；"拆分，不拆分顿号"、"</li>
                <li>如需调整拆分规则，请联系技术人员修改数据库函数</li>
                <li>建议定期审查拆分效果，优化规则配置</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Search } from 'lucide-react';
import type { AppPlatform } from '@/types/types';
import { mergePlatforms } from '@/db/api';

interface PlatformMergeDialogProps {
  open: boolean;
  onClose: () => void;
  platforms: AppPlatform[];
  onMergeComplete: () => void;
}

export default function PlatformMergeDialog({
  open,
  onClose,
  platforms,
  onMergeComplete
}: PlatformMergeDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mainPlatformId, setMainPlatformId] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 筛选平台列表
  const filteredPlatforms = useMemo(() => {
    if (!searchTerm.trim()) return platforms;
    const term = searchTerm.toLowerCase().trim();
    return platforms.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.id.toLowerCase().includes(term)
    );
  }, [platforms, searchTerm]);

  // 重置状态
  useEffect(() => {
    if (!open) {
      setSelectedPlatforms([]);
      setMainPlatformId('');
      setSearchTerm('');
    }
  }, [open]);

  // 选择主平台时自动勾选它
  useEffect(() => {
    if (mainPlatformId && !selectedPlatforms.includes(mainPlatformId)) {
      setSelectedPlatforms(prev => [...prev, mainPlatformId]);
    }
  }, [mainPlatformId, selectedPlatforms]);

  // 处理复选框选择
  const handleCheckboxChange = (platformId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms(prev => [...prev, platformId]);
    } else {
      setSelectedPlatforms(prev => prev.filter(id => id !== platformId));
      if (mainPlatformId === platformId) {
        setMainPlatformId('');
      }
    }
  };

  // 执行合并操作
  const handleMerge = async () => {
    if (selectedPlatforms.length < 2) {
      toast.error('请选择至少两个平台进行合并');
      return;
    }
    
    if (!mainPlatformId) {
      toast.error('请选择主平台');
      return;
    }

    const platformsToMerge = selectedPlatforms.filter(id => id !== mainPlatformId);
    const mainPlatform = platforms.find(p => p.id === mainPlatformId);
    const mergePlatformNames = platforms.filter(p => platformsToMerge.includes(p.id)).map(p => p.name);

    // 二次确认
    const confirmed = window.confirm(
      `确定要执行以下合并操作吗？\n\n` +
      `主平台（保留）：${mainPlatform?.name}\n` +
      `要合并的平台（将被删除）：${mergePlatformNames.join('、')}\n\n` +
      `合并后，所有 ${mergePlatformNames.join('、')} 平台的案例数据将转移到 ${mainPlatform?.name}，` +
      `且这些平台将被删除。此操作不可撤销！`
    );

    if (!confirmed) return;

    setIsMerging(true);
    try {
      const result = await mergePlatforms(mainPlatformId, platformsToMerge);
      
      const message = `✅ 平台合并成功！\n\n` +
        `保留平台：${result.mainPlatformName}\n` +
        `合并了 ${result.mergedCount} 个平台：${result.mergedPlatformNames.join('、')}\n` +
        `影响了 ${result.affectedCases} 条案例`;
      
      toast.success(message, {
        duration: 6000,
      });
      
      onMergeComplete();
      onClose();
    } catch (error) {
      console.error('平台合并失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error(`平台合并失败：${errorMessage}`, {
        duration: 5000,
      });
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 shrink-0">
          <DialogTitle className="text-xl">合并应用平台</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            选择要合并的平台，主平台将保留，其他平台的数据将被转移
          </p>
        </DialogHeader>
        
        {/* Fixed Header Section - No longer inside ScrollArea */}
        <div className="space-y-4 pr-4 shrink-0">
      
          
          {selectedPlatforms.length >= 2 && mainPlatformId && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                已选择 {selectedPlatforms.length} 个平台，
                主平台：<strong className="text-base">{platforms.find(p => p.id === mainPlatformId)?.name}</strong>
              </AlertDescription>
            </Alert>
          )}
          
          {/* 搜索框 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">搜索平台</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="按平台名称或ID搜索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchTerm && (
              <p className="text-xs text-muted-foreground">
                找到 {filteredPlatforms.length} 个匹配的平台
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between border-b pb-2">
            <Label className="text-base font-semibold">选择要合并的平台</Label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                共 {platforms.length} 个平台
              </span>
              {filteredPlatforms.length < platforms.length && (
                <Badge variant="secondary" className="text-xs">
                  显示 {filteredPlatforms.length} 个
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable List Section */}
        <div className="flex-1 overflow-y-auto pr-4 mt-2 min-h-0">
          <div className="space-y-3 pb-2">
            {/* 顶部滚动提示 */}
            {filteredPlatforms.length > 6 && (
              <div className="text-center py-2 bg-muted/30 rounded-lg">
              </div>
            )}
            
            {filteredPlatforms.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  未找到匹配的平台，请尝试其他搜索词
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredPlatforms.map((platform, index) => {
                    const isSelected = selectedPlatforms.includes(platform.id);
                    const isMain = mainPlatformId === platform.id;
                    
                    return (
                      <div 
                        key={platform.id} 
                        className={`flex items-center gap-3 p-3 border rounded-lg transition-all cursor-pointer ${
                          isMain 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : isSelected
                            ? 'border-primary/50 bg-primary/[0.02]'
                            : 'hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => handleCheckboxChange(platform.id, !isSelected)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCheckboxChange(platform.id, Boolean(checked))}
                          className="mt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                            <span 
                              className={`font-medium ${
                                isMain ? 'text-primary text-base' : 'text-sm'
                              }`}
                              title={platform.name}
                            >
                              {platform.name}
                            </span>
                            {isMain && (
                              <Badge variant="default" className="shrink-0">
                                主平台
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate" title={`ID: ${platform.id}`}>
                            ID: {platform.id.slice(0, 8)}...
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant={isMain ? 'default' : 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMainPlatformId(platform.id);
                          }}
                          disabled={!isSelected || isMerging}
                          className="shrink-0"
                        >
                          {isMain ? '✓ 主平台' : '设为主平台'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                {/* 底部提示 */}
                {filteredPlatforms.length > 6 && (
                  <div className="text-center py-3 border-t mt-2">
                    <p className="text-xs text-muted-foreground">
                      ✓ 已显示全部 {filteredPlatforms.length} 个平台
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-4 pt-4 border-t shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedPlatforms.length > 0 ? (
                <span>已选择 <strong>{selectedPlatforms.length}</strong> 个平台</span>
              ) : (
                <span>请至少选择 2 个平台进行合并</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isMerging}
              >
                取消
              </Button>
              <Button 
                onClick={handleMerge} 
                disabled={isMerging || selectedPlatforms.length < 2 || !mainPlatformId}
              >
                {isMerging ? '合并中...' : `合并 ${selectedPlatforms.length} 个平台`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface CreatableComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyText?: string;
  onCreate?: (name: string) => Promise<string>; // 返回新创建项的ID
  disabled?: boolean;
  className?: string;
}

export function CreatableCombobox({
  value,
  onValueChange,
  options,
  placeholder = '选择选项',
  emptyText = '未找到选项',
  onCreate,
  disabled = false,
  className,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [creating, setCreating] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  // 过滤选项
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  // 判断是否可以创建新选项
  const canCreate =
    onCreate &&
    searchValue.trim() !== '' &&
    !options.some((option) => option.label.toLowerCase() === searchValue.toLowerCase());

  // 创建新选项
  const handleCreate = async () => {
    if (!onCreate || !searchValue.trim()) return;

    try {
      setCreating(true);
      const newId = await onCreate(searchValue.trim());
      onValueChange(newId);
      setSearchValue('');
      setOpen(false);
    } catch (error) {
      console.error('创建失败:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="搜索或输入新名称..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {canCreate ? (
                <div className="py-2 px-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    <Plus className="h-4 w-4" />
                    {creating ? '创建中...' : `新增：${searchValue}`}
                  </Button>
                </div>
              ) : (
                <div className="py-6 text-center text-sm">{emptyText}</div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {canCreate && filteredOptions.length > 0 && (
                <CommandItem
                  value={`__create__${searchValue}`}
                  onSelect={handleCreate}
                  disabled={creating}
                  className="border-t"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {creating ? '创建中...' : `新增：${searchValue}`}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

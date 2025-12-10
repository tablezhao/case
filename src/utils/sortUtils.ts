import type { RegulatoryDepartment } from '@/types/types';

/**
 * 对监管部门列表进行排序
 * 排序规则：国家级部门优先，省级部门在后，同级别按名称排序
 * @param departments 部门列表
 * @returns 排序后的部门列表
 */
export function sortDepartments(departments: RegulatoryDepartment[]): RegulatoryDepartment[] {
  return [...departments].sort((a, b) => {
    // 国家级部门优先
    if (a.level === 'national' && b.level === 'provincial') return -1;
    if (a.level === 'provincial' && b.level === 'national') return 1;
    // 同级别按名称排序
    return a.name.localeCompare(b.name, 'zh-CN');
  });
}

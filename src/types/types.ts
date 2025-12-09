// 数据库表类型定义

export type UserRole = 'user' | 'admin';

export type DepartmentLevel = 'national' | 'provincial';

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface RegulatoryDepartment {
  id: string;
  name: string;
  level: DepartmentLevel;
  province: string | null;
  created_at: string;
}

export interface AppPlatform {
  id: string;
  name: string;
  created_at: string;
}

export interface Case {
  id: string;
  report_date: string;
  app_name: string;
  app_developer: string | null;
  department_id: string | null;
  platform_id: string | null;
  violation_content: string | null; // 主要违规内容（整合了原违规摘要和详细内容）
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegulatoryNews {
  id: string;
  publish_date: string;
  department_id: string | null;
  title: string;
  summary: string | null;
  content: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FrontendConfig {
  id: string;
  module_key: string;
  module_name: string;
  is_visible: boolean;
  sort_order: number;
  updated_at: string;
}

export interface FooterSettings {
  id: string;
  section: string;
  title: string;
  content: any; // JSON content
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaticContent {
  id: string;
  content_key: string;
  content_name: string;
  content_html: string | null;
  updated_at: string;
}

export interface ModuleSetting {
  id: string;
  module_key: string;
  module_name: string;
  is_enabled: boolean;
  display_order: number;
  description: string | null;
  updated_at: string;
}

// 扩展类型（用于前端展示，包含关联数据）
export interface CaseWithDetails extends Case {
  department?: RegulatoryDepartment;
  platform?: AppPlatform;
}

export interface RegulatoryNewsWithDetails extends RegulatoryNews {
  department?: RegulatoryDepartment;
}

// 统计数据类型
export interface StatsOverview {
  total_cases: number; // 累计通报频次（按部门+日期去重）
  total_apps: number;
  latest_report_date: string | null;
  latest_department: string | null;
  // 本月统计
  current_month_cases: number; // 本月通报频次（按部门+日期去重）
  current_month_apps: number;
  // 本季度统计
  current_quarter_cases: number; // 本季度通报频次（按部门+日期去重）
  current_quarter_apps: number;
  // 本年度统计
  current_year_cases: number; // 本年度通报频次（按部门+日期去重）
  current_year_apps: number;
  // 月度环比数据
  cases_change: number; // 相对上月的变化量（基于通报频次）
  cases_change_percent: number; // 变化百分比
  apps_change: number;
  apps_change_percent: number;
  // 季度环比数据
  quarter_cases_change: number; // 相对上季度的变化量（基于通报频次）
  quarter_cases_change_percent: number; // 变化百分比
  quarter_apps_change: number;
  quarter_apps_change_percent: number;
  // 年度环比数据
  year_cases_change: number; // 相对上年度的变化量（基于通报频次）
  year_cases_change_percent: number; // 变化百分比
  year_apps_change: number;
  year_apps_change_percent: number;
}

// Excel导入数据类型
export interface CaseImportData {
  report_date: string;
  app_name: string;
  app_developer?: string;
  department_name: string;
  platform_name: string;
  violation_content?: string; // 主要违规内容
  source_url?: string;
}

export interface NewsImportData {
  publish_date: string;
  department_name: string;
  title: string;
  summary?: string;
  content?: string;
  source_url?: string;
}

// 案例筛选参数类型
export interface CaseFilterParams {
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
  departmentIds?: string[]; // 监管部门ID列表
  platformIds?: string[]; // 应用平台ID列表
}

// 网站基本信息配置
export interface SiteSettings {
  id: string;
  site_title: string;
  site_subtitle: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

// 数据库表类型定义

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface RegulatoryDepartment {
  id: string;
  name: string;
  province: string | null;
  city: string | null;
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
  violation_summary: string | null;
  violation_detail: string | null;
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
  total_cases: number;
  total_apps: number;
  latest_report_date: string | null;
  latest_department: string | null;
}

// Excel导入数据类型
export interface CaseImportData {
  report_date: string;
  app_name: string;
  app_developer?: string;
  department_name: string;
  platform_name: string;
  violation_summary?: string;
  violation_detail?: string;
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

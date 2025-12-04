import { supabase } from './supabase';
import type {
  Profile,
  RegulatoryDepartment,
  AppPlatform,
  Case,
  CaseWithDetails,
  RegulatoryNews,
  RegulatoryNewsWithDetails,
  FrontendConfig,
  FooterSettings,
  StaticContent,
  StatsOverview,
} from '@/types/types';

// ============ 用户相关 ============
export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, role: 'user' | 'admin') {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);
  
  if (error) throw error;
}

// ============ 监管部门相关 ============
export async function getDepartments() {
  const { data, error } = await supabase
    .from('regulatory_departments')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createDepartment(department: Omit<RegulatoryDepartment, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('regulatory_departments')
    .insert(department)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, updates: Partial<RegulatoryDepartment>) {
  const { error } = await supabase
    .from('regulatory_departments')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase
    .from('regulatory_departments')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============ 应用平台相关 ============
export async function getPlatforms() {
  const { data, error } = await supabase
    .from('app_platforms')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createPlatform(platform: Omit<AppPlatform, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('app_platforms')
    .insert(platform)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function updatePlatform(id: string, updates: Partial<AppPlatform>) {
  const { error } = await supabase
    .from('app_platforms')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
}

export async function deletePlatform(id: string) {
  const { error } = await supabase
    .from('app_platforms')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============ 案例相关 ============
export async function getCases(page = 1, pageSize = 20, sortBy = 'report_date', sortOrder: 'asc' | 'desc' = 'desc') {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('cases')
    .select(`
      *,
      department:regulatory_departments(*),
      platform:app_platforms(*)
    `, { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to);
  
  if (error) throw error;
  return {
    data: Array.isArray(data) ? data : [],
    total: count || 0,
  };
}

export async function getCaseById(id: string): Promise<CaseWithDetails | null> {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      department:regulatory_departments(*),
      platform:app_platforms(*)
    `)
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function createCase(caseData: Omit<Case, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('cases')
    .insert(caseData)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function updateCase(id: string, updates: Partial<Case>) {
  const { error } = await supabase
    .from('cases')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}

export async function deleteCase(id: string) {
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function batchCreateCases(cases: Omit<Case, 'id' | 'created_at' | 'updated_at'>[]) {
  const { data, error } = await supabase
    .from('cases')
    .insert(cases)
    .select();
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ 监管资讯相关 ============
export async function getNews(page = 1, pageSize = 20, sortBy = 'publish_date', sortOrder: 'asc' | 'desc' = 'desc') {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('regulatory_news')
    .select(`
      *,
      department:regulatory_departments(*)
    `, { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to);
  
  if (error) throw error;
  return {
    data: Array.isArray(data) ? data : [],
    total: count || 0,
  };
}

export async function getNewsById(id: string): Promise<RegulatoryNewsWithDetails | null> {
  const { data, error } = await supabase
    .from('regulatory_news')
    .select(`
      *,
      department:regulatory_departments(*)
    `)
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function createNews(news: Omit<RegulatoryNews, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('regulatory_news')
    .insert(news)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function updateNews(id: string, updates: Partial<RegulatoryNews>) {
  const { error } = await supabase
    .from('regulatory_news')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}

export async function deleteNews(id: string) {
  const { error } = await supabase
    .from('regulatory_news')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function batchCreateNews(newsList: Omit<RegulatoryNews, 'id' | 'created_at' | 'updated_at'>[]) {
  const { data, error } = await supabase
    .from('regulatory_news')
    .insert(newsList)
    .select();
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ 前端配置相关 ============
export async function getFrontendConfigs() {
  const { data, error } = await supabase
    .from('frontend_config')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function updateFrontendConfig(id: string, updates: Partial<FrontendConfig>) {
  const { error } = await supabase
    .from('frontend_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}

export async function batchUpdateFrontendConfigs(configs: { id: string; is_visible?: boolean; sort_order?: number }[]) {
  const promises = configs.map(config =>
    supabase
      .from('frontend_config')
      .update({ ...config, updated_at: new Date().toISOString() })
      .eq('id', config.id)
  );
  
  await Promise.all(promises);
}

// ============ 静态内容相关 ============
export async function getStaticContents() {
  const { data, error } = await supabase
    .from('static_content')
    .select('*')
    .order('content_key', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getStaticContentByKey(key: string): Promise<StaticContent | null> {
  const { data, error } = await supabase
    .from('static_content')
    .select('*')
    .eq('content_key', key)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function updateStaticContent(id: string, updates: Partial<StaticContent>) {
  const { error } = await supabase
    .from('static_content')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}

// ============ 统计数据相关 ============
export async function getStatsOverview(): Promise<StatsOverview> {
  // 获取案例总数
  const { count: totalCases } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true });

  // 获取应用总数（去重）
  const { data: appsData } = await supabase
    .from('cases')
    .select('app_name');
  
  const uniqueApps = new Set(appsData?.map(c => c.app_name) || []);

  // 获取最近一次通报
  const { data: latestCase } = await supabase
    .from('cases')
    .select(`
      report_date,
      department:regulatory_departments(name)
    `)
    .order('report_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const department = latestCase?.department as unknown as { name: string } | null;

  return {
    total_cases: totalCases || 0,
    total_apps: uniqueApps.size,
    latest_report_date: latestCase?.report_date || null,
    latest_department: department?.name || null,
  };
}

// 获取年度趋势数据
export async function getYearlyTrend() {
  const { data, error } = await supabase
    .from('cases')
    .select('report_date');
  
  if (error) throw error;
  
  const yearCounts: Record<string, number> = {};
  (data || []).forEach(item => {
    const year = item.report_date.substring(0, 4);
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });

  return Object.entries(yearCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

// 获取月度趋势数据
export async function getMonthlyTrend(year?: string) {
  let query = supabase.from('cases').select('report_date');
  
  if (year) {
    query = query.gte('report_date', `${year}-01-01`).lte('report_date', `${year}-12-31`);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  const monthCounts: Record<string, number> = {};
  (data || []).forEach(item => {
    const month = item.report_date.substring(0, 7);
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });

  return Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// 获取部门分布数据
export async function getDepartmentDistribution() {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      department_id,
      department:regulatory_departments(name)
    `);
  
  if (error) throw error;
  
  const deptCounts: Record<string, number> = {};
  (data || []).forEach(item => {
    const dept = item.department as unknown as { name: string } | null;
    const deptName = dept?.name || '未知部门';
    deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
  });

  return Object.entries(deptCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// 获取平台分布数据
export async function getPlatformDistribution() {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      platform_id,
      platform:app_platforms(name)
    `);
  
  if (error) throw error;
  
  const platformCounts: Record<string, number> = {};
  (data || []).forEach(item => {
    const plat = item.platform as unknown as { name: string } | null;
    const platformName = plat?.name || '未知平台';
    platformCounts[platformName] = (platformCounts[platformName] || 0) + 1;
  });

  return Object.entries(platformCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// 获取地理分布数据
export async function getGeoDistribution() {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      department_id,
      department:regulatory_departments(province, city)
    `);
  
  if (error) throw error;
  
  const provinceCounts: Record<string, number> = {};
  (data || []).forEach(item => {
    const dept = item.department as unknown as { province: string | null; city: string | null } | null;
    const province = dept?.province || '未知';
    provinceCounts[province] = (provinceCounts[province] || 0) + 1;
  });

  return Object.entries(provinceCounts)
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count);
}

// 获取违规关键词（用于词云）
export async function getViolationKeywords() {
  const { data, error } = await supabase
    .from('cases')
    .select('violation_summary');
  
  if (error) throw error;
  
  const keywords: Record<string, number> = {};
  (data || []).forEach(item => {
    if (!item.violation_summary) return;
    
    // 简单的关键词提取（实际应用中可以使用更复杂的NLP算法）
    const words = item.violation_summary
      .split(/[，。、；：！？\s]+/)
      .filter(w => w.length >= 2 && w.length <= 10);
    
    words.forEach(word => {
      keywords[word] = (keywords[word] || 0) + 1;
    });
  });

  return Object.entries(keywords)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50);
}

// 获取最近的监管资讯
export async function getRecentNews(limit = 5) {
  const { data, error } = await supabase
    .from('regulatory_news')
    .select(`
      *,
      department:regulatory_departments(name)
    `)
    .order('publish_date', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ============ 页脚配置相关 ============
export async function getFooterSettings() {
  const { data, error } = await supabase
    .from('footer_settings')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllFooterSettings() {
  const { data, error } = await supabase
    .from('footer_settings')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getFooterSettingBySection(section: string) {
  const { data, error } = await supabase
    .from('footer_settings')
    .select('*')
    .eq('section', section)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function updateFooterSetting(
  id: string,
  updates: {
    title?: string;
    content?: any;
    display_order?: number;
    is_active?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('footer_settings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createFooterSetting(setting: {
  section: string;
  title: string;
  content: any;
  display_order: number;
  is_active: boolean;
}) {
  const { data, error } = await supabase
    .from('footer_settings')
    .insert(setting)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteFooterSetting(id: string) {
  const { error } = await supabase
    .from('footer_settings')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

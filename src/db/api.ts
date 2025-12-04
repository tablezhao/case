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
  CaseFilterParams,
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

export async function getNationalDepartments() {
  const { data, error } = await supabase
    .from('regulatory_departments')
    .select('*')
    .eq('level', 'national')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getProvincialDepartments(province?: string) {
  let query = supabase
    .from('regulatory_departments')
    .select('*')
    .eq('level', 'provincial');
  
  if (province) {
    query = query.eq('province', province);
  }
  
  query = query.order('name', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getProvincesList() {
  const { data, error } = await supabase
    .from('regulatory_departments')
    .select('province')
    .eq('level', 'provincial')
    .not('province', 'is', null)
    .order('province', { ascending: true });
  
  if (error) throw error;
  
  // 去重
  const provinces = Array.from(new Set(
    (Array.isArray(data) ? data : [])
      .map(d => d.province)
      .filter(Boolean)
  ));
  
  return provinces;
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
export async function getCases(
  page = 1, 
  pageSize = 20, 
  sortBy = 'report_date', 
  sortOrder: 'asc' | 'desc' = 'desc',
  filters?: CaseFilterParams
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('cases')
    .select(`
      *,
      department:regulatory_departments(*),
      platform:app_platforms(*)
    `, { count: 'exact' });

  // 应用筛选条件
  if (filters) {
    if (filters.startDate) {
      query = query.gte('report_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('report_date', filters.endDate);
    }
    if (filters.departmentIds && filters.departmentIds.length > 0) {
      query = query.in('department_id', filters.departmentIds);
    }
    if (filters.platformIds && filters.platformIds.length > 0) {
      query = query.in('platform_id', filters.platformIds);
    }
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

  const { data, error, count } = await query;
  
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

// 批量删除案例
export async function batchDeleteCases(ids: string[]) {
  const { error } = await supabase
    .from('cases')
    .delete()
    .in('id', ids);
  
  if (error) throw error;
}

// 批量更新案例
export async function batchUpdateCases(updates: { id: string; data: Partial<Omit<Case, 'id' | 'created_at' | 'updated_at'>> }[]) {
  // Supabase不支持批量更新不同数据，需要逐个更新
  const promises = updates.map(({ id, data }) =>
    supabase
      .from('cases')
      .update(data)
      .eq('id', id)
  );
  
  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);
  
  if (errors.length > 0) {
    throw new Error(`批量更新失败: ${errors.length} 条记录更新失败`);
  }
}

// 导入案例并去重（保留最新数据）
export async function batchCreateCasesWithDedup(cases: Omit<Case, 'id' | 'created_at' | 'updated_at'>[]) {
  // 1. 获取所有现有案例
  const { data: existingCases, error: fetchError } = await supabase
    .from('cases')
    .select('*')
    .order('id', { ascending: true });
  
  if (fetchError) throw fetchError;
  
  const existingCasesArray = Array.isArray(existingCases) ? existingCases : [];
  
  // 2. 检查重复并收集需要删除的旧数据ID
  const duplicateIds: string[] = [];
  const newCases: Omit<Case, 'id' | 'created_at' | 'updated_at'>[] = [];
  
  for (const newCase of cases) {
    // 查找完全匹配的现有案例
    const duplicate = existingCasesArray.find(existing => 
      existing.report_date === newCase.report_date &&
      existing.app_name === newCase.app_name &&
      existing.app_developer === newCase.app_developer &&
      existing.department_id === newCase.department_id &&
      existing.platform_id === newCase.platform_id &&
      existing.violation_content === newCase.violation_content &&
      existing.source_url === newCase.source_url
    );
    
    if (duplicate) {
      // 找到重复数据，标记旧数据待删除
      duplicateIds.push(duplicate.id);
    }
    
    // 所有新数据都要导入（包括重复的，因为要保留最新的）
    newCases.push(newCase);
  }
  
  // 3. 删除重复的旧数据
  if (duplicateIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('cases')
      .delete()
      .in('id', duplicateIds);
    
    if (deleteError) throw deleteError;
  }
  
  // 4. 插入新数据
  const { data: insertedData, error: insertError } = await supabase
    .from('cases')
    .insert(newCases)
    .select();
  
  if (insertError) throw insertError;
  
  return {
    inserted: Array.isArray(insertedData) ? insertedData.length : 0,
    duplicatesRemoved: duplicateIds.length,
  };
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
  // 获取当前年月和上月
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastMonthStr = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`;

  // 计算下月（用于查询范围）
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const nextMonthStr = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}`;

  // 获取所有案例数据（用于计算通报频次）
  const { data: allCases } = await supabase
    .from('cases')
    .select('report_date, department_id, app_name');

  // 计算累计通报频次（按部门+日期去重）
  const totalReportFrequency = new Set(
    (allCases || []).map(c => `${c.department_id}_${c.report_date}`)
  ).size;

  // 获取应用总数（去重）
  const uniqueApps = new Set((allCases || []).map(c => c.app_name));

  // 获取本月案例
  const { data: currentMonthCases } = await supabase
    .from('cases')
    .select('report_date, department_id, app_name')
    .gte('report_date', `${currentMonthStr}-01`)
    .lt('report_date', `${nextMonthStr}-01`);

  // 获取上月案例
  const { data: lastMonthCases } = await supabase
    .from('cases')
    .select('report_date, department_id, app_name')
    .gte('report_date', `${lastMonthStr}-01`)
    .lt('report_date', `${currentMonthStr}-01`);

  // 计算本月通报频次（按部门+日期去重）
  const currentMonthFrequency = new Set(
    (currentMonthCases || []).map(c => `${c.department_id}_${c.report_date}`)
  ).size;

  // 计算上月通报频次（按部门+日期去重）
  const lastMonthFrequency = new Set(
    (lastMonthCases || []).map(c => `${c.department_id}_${c.report_date}`)
  ).size;
  
  const currentMonthApps = new Set((currentMonthCases || []).map(c => c.app_name)).size;
  const lastMonthApps = new Set((lastMonthCases || []).map(c => c.app_name)).size;

  // 计算环比（基于通报频次）
  const casesChange = currentMonthFrequency - lastMonthFrequency;
  const casesChangePercent = lastMonthFrequency === 0 ? 0 : (casesChange / lastMonthFrequency) * 100;
  
  const appsChange = currentMonthApps - lastMonthApps;
  const appsChangePercent = lastMonthApps === 0 ? 0 : (appsChange / lastMonthApps) * 100;

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
    total_cases: totalReportFrequency,
    total_apps: uniqueApps.size,
    latest_report_date: latestCase?.report_date || null,
    latest_department: department?.name || null,
    current_month_cases: currentMonthFrequency,
    current_month_apps: currentMonthApps,
    cases_change: casesChange,
    cases_change_percent: casesChangePercent,
    apps_change: appsChange,
    apps_change_percent: appsChangePercent,
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

// 获取部门分布数据（所有部门）
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

// 获取国家级部门分布数据
export async function getNationalDepartmentDistribution() {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      department_id,
      department:regulatory_departments(name, level)
    `);
  
  if (error) throw error;
  
  const deptCounts: Record<string, number> = {};
  (data || []).forEach(item => {
    const dept = item.department as unknown as { name: string; level: string } | null;
    // 只统计国家级部门
    if (dept?.level === 'national') {
      const deptName = dept?.name || '未知部门';
      deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
    }
  });

  return Object.entries(deptCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// 获取省级部门分布数据
export async function getProvincialDepartmentDistribution() {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      department_id,
      department:regulatory_departments(name, level)
    `);
  
  if (error) throw error;
  
  const deptCounts: Record<string, number> = {};
  (data || []).forEach(item => {
    const dept = item.department as unknown as { name: string; level: string } | null;
    // 只统计省级部门
    if (dept?.level === 'provincial') {
      const deptName = dept?.name || '未知部门';
      deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
    }
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
      department:regulatory_departments(province, level)
    `);
  
  if (error) throw error;
  
  const provinceCounts: Record<string, number> = {};
  (data || []).forEach(item => {
    const dept = item.department as unknown as { province: string | null; level: string } | null;
    
    // 国家级部门归入"国家级"类别
    if (dept?.level === 'national') {
      provinceCounts['国家级'] = (provinceCounts['国家级'] || 0) + 1;
    } else {
      // 省级部门按省份统计
      const province = dept?.province || '未知';
      provinceCounts[province] = (provinceCounts[province] || 0) + 1;
    }
  });

  return Object.entries(provinceCounts)
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count);
}

// 获取违规关键词（用于词云）
export async function getViolationKeywords() {
  const { data, error } = await supabase
    .from('cases')
    .select('violation_content');
  
  if (error) throw error;
  
  const keywords: Record<string, number> = {};
  (data || []).forEach(item => {
    if (!item.violation_content) return;
    
    // 简单的关键词提取（实际应用中可以使用更复杂的NLP算法）
    const words = item.violation_content
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

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
  ModuleSetting,
  SiteSettings,
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

// 获取部门统计数据（累计通报频次和相关应用总数）
export async function getDepartmentsWithStats() {
  // 首先获取所有部门
  const { data: departments, error: deptError } = await supabase
    .from('regulatory_departments')
    .select('*')
    .order('name', { ascending: true });
  
  if (deptError) throw deptError;
  
  if (!Array.isArray(departments) || departments.length === 0) {
    return [];
  }
  
  // 为每个部门获取统计数据
  const departmentsWithStats = await Promise.all(
    departments.map(async (dept) => {
      // 获取该部门的所有案例（包含通报日期）
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('report_date, app_name')
        .eq('department_id', dept.id);
      
      if (casesError) {
        console.error(`获取部门 ${dept.name} 的案例数据失败:`, casesError);
      }
      
      const casesArray = Array.isArray(cases) ? cases : [];
      
      // 计算通报频次：按自然日合并，每日只计1次
      const uniqueDates = new Set(
        casesArray
          .map(item => {
            if (!item.report_date) return null;
            // 提取日期部分（YYYY-MM-DD）
            const date = new Date(item.report_date);
            return date.toISOString().split('T')[0];
          })
          .filter(Boolean)
      );
      const caseCount = uniqueDates.size;
      
      // 计算去重后的应用总数
      const uniqueApps = new Set(
        casesArray
          .map(item => item.app_name)
          .filter(Boolean)
      );
      
      return {
        ...dept,
        case_count: caseCount,
        app_count: uniqueApps.size,
      };
    })
  );
  
  return departmentsWithStats;
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

// 获取国家级部门（带统计数据）
export async function getNationalDepartmentsWithStats() {
  const departments = await getNationalDepartments();
  
  if (departments.length === 0) {
    return [];
  }
  
  // 为每个部门获取统计数据
  const departmentsWithStats = await Promise.all(
    departments.map(async (dept) => {
      // 获取该部门的所有案例（包含通报日期和应用名称）
      const { data: cases } = await supabase
        .from('cases')
        .select('report_date, app_name')
        .eq('department_id', dept.id);
      
      const casesArray = Array.isArray(cases) ? cases : [];
      
      // 计算通报频次：按自然日合并，每日只计1次
      const uniqueDates = new Set(
        casesArray
          .map(item => {
            if (!item.report_date) return null;
            // 提取日期部分（YYYY-MM-DD）
            const date = new Date(item.report_date);
            return date.toISOString().split('T')[0];
          })
          .filter(Boolean)
      );
      const caseCount = uniqueDates.size;
      
      // 计算去重后的应用总数
      const uniqueApps = new Set(
        casesArray
          .map(item => item.app_name)
          .filter(Boolean)
      );
      
      return {
        ...dept,
        case_count: caseCount,
        app_count: uniqueApps.size,
      };
    })
  );
  
  return departmentsWithStats;
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

// 获取省级部门（带统计数据）
export async function getProvincialDepartmentsWithStats(province?: string) {
  const departments = await getProvincialDepartments(province);
  
  if (departments.length === 0) {
    return [];
  }
  
  // 为每个部门获取统计数据
  const departmentsWithStats = await Promise.all(
    departments.map(async (dept) => {
      // 获取该部门的所有案例（包含通报日期和应用名称）
      const { data: cases } = await supabase
        .from('cases')
        .select('report_date, app_name')
        .eq('department_id', dept.id);
      
      const casesArray = Array.isArray(cases) ? cases : [];
      
      // 计算通报频次：按自然日合并，每日只计1次
      const uniqueDates = new Set(
        casesArray
          .map(item => {
            if (!item.report_date) return null;
            // 提取日期部分（YYYY-MM-DD）
            const date = new Date(item.report_date);
            return date.toISOString().split('T')[0];
          })
          .filter(Boolean)
      );
      const caseCount = uniqueDates.size;
      
      // 计算去重后的应用总数
      const uniqueApps = new Set(
        casesArray
          .map(item => item.app_name)
          .filter(Boolean)
      );
      
      return {
        ...dept,
        case_count: caseCount,
        app_count: uniqueApps.size,
      };
    })
  );
  
  return departmentsWithStats;
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

// 获取平台统计数据（累计通报频次和相关应用总数）
export async function getPlatformsWithStats() {
  // 首先获取所有平台
  const { data: platforms, error: platError } = await supabase
    .from('app_platforms')
    .select('*')
    .order('name', { ascending: true });
  
  if (platError) throw platError;
  
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return [];
  }
  
  // 为每个平台获取统计数据
  const platformsWithStats = await Promise.all(
    platforms.map(async (plat) => {
      // 获取该平台的所有案例（包含通报日期和应用名称）
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('report_date, app_name')
        .eq('platform_id', plat.id);
      
      if (casesError) {
        console.error(`获取平台 ${plat.name} 的案例数据失败:`, casesError);
      }
      
      const casesArray = Array.isArray(cases) ? cases : [];
      
      // 计算通报频次：按自然日合并，每日只计1次
      const uniqueDates = new Set(
        casesArray
          .map(item => {
            if (!item.report_date) return null;
            // 提取日期部分（YYYY-MM-DD）
            const date = new Date(item.report_date);
            return date.toISOString().split('T')[0];
          })
          .filter(Boolean)
      );
      const caseCount = uniqueDates.size;
      
      // 计算去重后的应用总数
      const uniqueApps = new Set(
        casesArray
          .map(item => item.app_name)
          .filter(Boolean)
      );
      
      return {
        ...plat,
        case_count: caseCount,
        app_count: uniqueApps.size,
      };
    })
  );
  
  return platformsWithStats;
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
// 关键词预处理函数
function preprocessKeyword(keyword: string): string {
  if (!keyword || typeof keyword !== 'string') return '';
  
  // 转换全角字符为半角
  let processed = keyword.replace(/[\uFF01-\uFF5E]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
  });
  
  // 转换为小写
  processed = processed.toLowerCase();
  
  // 移除特殊字符（保留中文、英文、数字和空格）
  processed = processed.replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, '');
  
  // 去除多余空格
  processed = processed.trim().replace(/\s+/g, ' ');
  
  return processed;
}

// 获取同义词映射表（可扩展）
function getSynonymsMap(): Record<string, string[]> {
  return {
    '隐私': ['数据隐私', '个人信息', '用户信息', '数据保护', '个人数据'],
    '违规': ['违法', '不合规', '违法违规', '违规行为'],
    '广告': ['推送', '弹窗', '推广', '营销', '广告推送'],
    '权限': ['应用权限', '系统权限', '隐私权限'],
    '安全': ['数据安全', '信息安全', '系统安全', '网络安全'],
  };
}

// 根据关键词生成搜索建议
export function generateSearchSuggestions(keyword: string): string[] {
  if (!keyword || typeof keyword !== 'string') return [];
  
  const suggestions: string[] = [];
  const synonymsMap = getSynonymsMap();
  const lowerKeyword = keyword.toLowerCase();
  
  // 查找直接匹配的同义词
  for (const [word, synonyms] of Object.entries(synonymsMap)) {
    if (lowerKeyword.includes(word)) {
      suggestions.push(...synonyms.filter(s => !suggestions.includes(s)));
    }
    
    // 检查同义词是否包含关键词
    for (const synonym of synonyms) {
      if (lowerKeyword.includes(synonym)) {
        suggestions.push(word);
        break;
      }
    }
  }
  
  return suggestions.slice(0, 5); // 最多返回5个建议
}

// 格式化数字显示
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

export async function getCases(
  page = 1, 
  pageSize = 20, 
  sortBy = 'report_date', 
  sortOrder: 'asc' | 'desc' = 'desc',
  filters?: CaseFilterParams,
  searchKeyword?: string
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 预处理关键词
  const processedKeyword = preprocessKeyword(searchKeyword || '');
  
  // 检查是否有搜索关键词，不管是否经过预处理后为空
  const hasSearchKeyword = searchKeyword && typeof searchKeyword === 'string' && searchKeyword.trim().length > 0;
  
  // 使用全文搜索
  if (hasSearchKeyword) {
    try {
      // 调用数据库函数进行全文搜索
      const { data, error } = await supabase.rpc('search_cases', {
        query_text: processedKeyword || null,
        page_num: page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        start_date: filters?.startDate || null,
        end_date: filters?.endDate || null,
        department_ids: filters?.departmentIds?.length ? filters.departmentIds : null,
        platform_ids: filters?.platformIds?.length ? filters.platformIds : null
      });
      
      if (error) throw error;
      
      // 获取匹配总数
      const { data: countData, error: countError } = await supabase.rpc('search_cases_count', {
        query_text: processedKeyword || null,
        start_date: filters?.startDate || null,
        end_date: filters?.endDate || null,
        department_ids: filters?.departmentIds?.length ? filters.departmentIds : null,
        platform_ids: filters?.platformIds?.length ? filters.platformIds : null
      });
      
      if (countError) throw countError;
      
      // 如果需要关联部门和平台信息
      if (Array.isArray(data) && data.length > 0) {
        const ids = data.map(item => item.id);
        const { data: enrichedData } = await supabase
          .from('cases')
          .select('*, department:regulatory_departments(*), platform:app_platforms(*)')
          .in('id', ids);
        
        if (Array.isArray(enrichedData)) {
          return {
            data: enrichedData,
            total: typeof countData === 'number' ? countData : enrichedData.length,
            formattedTotal: formatNumber(typeof countData === 'number' ? countData : enrichedData.length),
            hasResults: Array.isArray(enrichedData) && enrichedData.length > 0
          };
        }
      }
      
      return {
        data: Array.isArray(data) ? data : [],
        total: typeof countData === 'number' ? countData : 0,
        formattedTotal: formatNumber(typeof countData === 'number' ? countData : 0),
        hasResults: Array.isArray(data) && data.length > 0
      };
    } catch (error) {
      console.error('全文搜索失败:', error);
      // 搜索失败时回退到标准查询，但仍然应用关键词过滤
    }
  }
  
  // 标准查询（非全文搜索或全文搜索失败时回退）
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

  // 如果没有全文搜索，且有搜索关键词，在标准查询中添加前端过滤
  if (hasSearchKeyword) {
    // 在标准查询中也添加关键词过滤条件
    query = query.or(
      `app_name.ilike.%${searchKeyword}%,` + 
      `app_developer.ilike.%${searchKeyword}%,` + 
      `violation_content.ilike.%${searchKeyword}%`
    );
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

  const { data, error, count } = await query;
  
  if (error) throw error;
  
  const resultData = Array.isArray(data) ? data : [];
  const resultTotal = count || 0;
  
  return {
    data: resultData,
    total: resultTotal,
    formattedTotal: formatNumber(resultTotal),
    hasResults: resultData.length > 0
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

// 智能导入案例（自动创建不存在的部门和平台）
export async function smartImportCases(
  rawData: Array<{
    report_date: string;
    app_name: string;
    app_developer?: string | null;
    department_name: string;
    platform_name: string;
    violation_content?: string | null;
    source_url?: string | null;
  }>
) {
  // 1. 获取现有的部门和平台
  const [existingDepartments, existingPlatforms] = await Promise.all([
    getDepartments(),
    getPlatforms(),
  ]);

  // 2. 收集需要创建的新部门和平台
  const newDepartmentNames = new Set<string>();
  const newPlatformNames = new Set<string>();
  const departmentMap = new Map<string, string>(); // name -> id
  const platformMap = new Map<string, string>(); // name -> id

  // 初始化已存在的部门和平台映射
  existingDepartments.forEach(dept => {
    departmentMap.set(dept.name, dept.id);
  });
  existingPlatforms.forEach(plat => {
    platformMap.set(plat.name, plat.id);
  });

  // 识别需要创建的新部门和平台
  rawData.forEach(row => {
    if (row.department_name && !departmentMap.has(row.department_name)) {
      newDepartmentNames.add(row.department_name);
    }
    if (row.platform_name && !platformMap.has(row.platform_name)) {
      newPlatformNames.add(row.platform_name);
    }
  });

  // 3. 批量创建新部门
  const createdDepartments: RegulatoryDepartment[] = [];
  for (const deptName of newDepartmentNames) {
    try {
      const newDept = await createDepartment({
        name: deptName,
        level: 'national', // 默认为国家级
        province: null,
      });
      if (newDept) {
        createdDepartments.push(newDept);
        departmentMap.set(newDept.name, newDept.id);
      }
    } catch (error) {
      console.error(`创建部门失败: ${deptName}`, error);
      throw new Error(`创建部门失败: ${deptName}`);
    }
  }

  // 4. 批量创建新平台
  const createdPlatforms: AppPlatform[] = [];
  for (const platName of newPlatformNames) {
    try {
      const newPlat = await createPlatform({
        name: platName,
      });
      if (newPlat) {
        createdPlatforms.push(newPlat);
        platformMap.set(newPlat.name, newPlat.id);
      }
    } catch (error) {
      console.error(`创建平台失败: ${platName}`, error);
      throw new Error(`创建平台失败: ${platName}`);
    }
  }

  // 5. 转换数据并导入案例
  const casesToImport = rawData.map(row => ({
    report_date: row.report_date,
    app_name: row.app_name,
    app_developer: row.app_developer || null,
    department_id: departmentMap.get(row.department_name) || null,
    platform_id: platformMap.get(row.platform_name) || null,
    violation_content: row.violation_content || null,
    source_url: row.source_url || null,
  }));

  // 6. 使用去重导入
  const importResult = await batchCreateCasesWithDedup(casesToImport);

  // 7. 返回详细结果
  return {
    ...importResult,
    createdDepartments: createdDepartments.length,
    createdPlatforms: createdPlatforms.length,
    newDepartments: createdDepartments.map(d => d.name),
    newPlatforms: createdPlatforms.map(p => p.name),
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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // ========== 本月和上月 ==========
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastMonthStr = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const nextMonthStr = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}`;

  // ========== 本季度和上季度 ==========
  const currentQuarter = Math.ceil(currentMonth / 3); // 1-4
  const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
  const quarterEndMonth = currentQuarter * 3;
  
  // 本季度范围
  const quarterStartStr = `${currentYear}-${String(quarterStartMonth).padStart(2, '0')}-01`;
  let quarterEndYear = currentYear;
  let quarterEndMonthNext = quarterEndMonth + 1;
  if (quarterEndMonthNext > 12) {
    quarterEndMonthNext = 1;
    quarterEndYear = currentYear + 1;
  }
  const quarterEndStr = `${quarterEndYear}-${String(quarterEndMonthNext).padStart(2, '0')}-01`;

  // 上季度范围
  const lastQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
  const lastQuarterYear = currentQuarter === 1 ? currentYear - 1 : currentYear;
  const lastQuarterStartMonth = (lastQuarter - 1) * 3 + 1;
  const lastQuarterEndMonth = lastQuarter * 3;
  const lastQuarterStartStr = `${lastQuarterYear}-${String(lastQuarterStartMonth).padStart(2, '0')}-01`;
  let lastQuarterEndYear = lastQuarterYear;
  let lastQuarterEndMonthNext = lastQuarterEndMonth + 1;
  if (lastQuarterEndMonthNext > 12) {
    lastQuarterEndMonthNext = 1;
    lastQuarterEndYear = lastQuarterYear + 1;
  }
  const lastQuarterEndStr = `${lastQuarterEndYear}-${String(lastQuarterEndMonthNext).padStart(2, '0')}-01`;

  // ========== 本年度和上年度 ==========
  const yearStartStr = `${currentYear}-01-01`;
  const yearEndStr = `${currentYear + 1}-01-01`;
  const lastYearStartStr = `${currentYear - 1}-01-01`;
  const lastYearEndStr = `${currentYear}-01-01`;

  // ========== 获取所有案例数据 ==========
  const { data: allCases } = await supabase
    .from('cases')
    .select('report_date, department_id, app_name');

  // 计算累计通报频次（按部门+日期去重）
  const totalReportFrequency = new Set(
    (allCases || []).map(c => `${c.department_id}_${c.report_date}`)
  ).size;

  // 获取应用总数（去重）
  const uniqueApps = new Set((allCases || []).map(c => c.app_name));

  // ========== 获取本月案例 ==========
  const { data: currentMonthCases } = await supabase
    .from('cases')
    .select('report_date, department_id, app_name')
    .gte('report_date', `${currentMonthStr}-01`)
    .lt('report_date', `${nextMonthStr}-01`);

  // ========== 获取上月案例 ==========
  const { data: lastMonthCases } = await supabase
    .from('cases')
    .select('report_date, department_id, app_name')
    .gte('report_date', `${lastMonthStr}-01`)
    .lt('report_date', `${currentMonthStr}-01`);

  // ========== 获取本季度案例 ==========
  const { data: currentQuarterCases } = await supabase
    .from('cases')
    .select('report_date, department_id, app_name')
    .gte('report_date', quarterStartStr)
    .lt('report_date', quarterEndStr);

  // ========== 获取上季度案例 ==========
  const { data: lastQuarterCases } = await supabase
    .from('cases')
    .select('report_date, department_id, app_name')
    .gte('report_date', lastQuarterStartStr)
    .lt('report_date', lastQuarterEndStr);

  // ========== 获取本年度案例 ==========
  const { data: currentYearCases } = await supabase
    .from('cases')
    .select('report_date, department_id, app_name')
    .gte('report_date', yearStartStr)
    .lt('report_date', yearEndStr);

  // ========== 获取上年度案例 ==========
  const { data: lastYearCases } = await supabase
    .from('cases')
    .select('report_date, department_id, app_name')
    .gte('report_date', lastYearStartStr)
    .lt('report_date', lastYearEndStr);

  // ========== 计算通报频次（按部门+日期去重）==========
  const currentMonthFrequency = new Set(
    (currentMonthCases || []).map(c => `${c.department_id}_${c.report_date}`)
  ).size;

  const lastMonthFrequency = new Set(
    (lastMonthCases || []).map(c => `${c.department_id}_${c.report_date}`)
  ).size;

  const currentQuarterFrequency = new Set(
    (currentQuarterCases || []).map(c => `${c.department_id}_${c.report_date}`)
  ).size;

  const lastQuarterFrequency = new Set(
    (lastQuarterCases || []).map(c => `${c.department_id}_${c.report_date}`)
  ).size;

  const currentYearFrequency = new Set(
    (currentYearCases || []).map(c => `${c.department_id}_${c.report_date}`)
  ).size;

  const lastYearFrequency = new Set(
    (lastYearCases || []).map(c => `${c.department_id}_${c.report_date}`)
  ).size;

  // ========== 计算涉及应用数（去重）==========
  const currentMonthApps = new Set((currentMonthCases || []).map(c => c.app_name)).size;
  const lastMonthApps = new Set((lastMonthCases || []).map(c => c.app_name)).size;
  const currentQuarterApps = new Set((currentQuarterCases || []).map(c => c.app_name)).size;
  const lastQuarterApps = new Set((lastQuarterCases || []).map(c => c.app_name)).size;
  const currentYearApps = new Set((currentYearCases || []).map(c => c.app_name)).size;
  const lastYearApps = new Set((lastYearCases || []).map(c => c.app_name)).size;

  // ========== 计算月度环比 ==========
  const casesChange = currentMonthFrequency - lastMonthFrequency;
  const casesChangePercent = lastMonthFrequency === 0 ? 0 : (casesChange / lastMonthFrequency) * 100;
  const appsChange = currentMonthApps - lastMonthApps;
  const appsChangePercent = lastMonthApps === 0 ? 0 : (appsChange / lastMonthApps) * 100;

  // ========== 计算季度环比 ==========
  const quarterCasesChange = currentQuarterFrequency - lastQuarterFrequency;
  const quarterCasesChangePercent = lastQuarterFrequency === 0 ? 0 : (quarterCasesChange / lastQuarterFrequency) * 100;
  const quarterAppsChange = currentQuarterApps - lastQuarterApps;
  const quarterAppsChangePercent = lastQuarterApps === 0 ? 0 : (quarterAppsChange / lastQuarterApps) * 100;

  // ========== 计算年度环比 ==========
  const yearCasesChange = currentYearFrequency - lastYearFrequency;
  const yearCasesChangePercent = lastYearFrequency === 0 ? 0 : (yearCasesChange / lastYearFrequency) * 100;
  const yearAppsChange = currentYearApps - lastYearApps;
  const yearAppsChangePercent = lastYearApps === 0 ? 0 : (yearAppsChange / lastYearApps) * 100;

  // ========== 获取最近一次通报 ==========
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
    // 本月数据
    current_month_cases: currentMonthFrequency,
    current_month_apps: currentMonthApps,
    // 本季度数据
    current_quarter_cases: currentQuarterFrequency,
    current_quarter_apps: currentQuarterApps,
    // 本年度数据
    current_year_cases: currentYearFrequency,
    current_year_apps: currentYearApps,
    // 月度环比
    cases_change: casesChange,
    cases_change_percent: casesChangePercent,
    apps_change: appsChange,
    apps_change_percent: appsChangePercent,
    // 季度环比
    quarter_cases_change: quarterCasesChange,
    quarter_cases_change_percent: quarterCasesChangePercent,
    quarter_apps_change: quarterAppsChange,
    quarter_apps_change_percent: quarterAppsChangePercent,
    // 年度环比
    year_cases_change: yearCasesChange,
    year_cases_change_percent: yearCasesChangePercent,
    year_apps_change: yearAppsChange,
    year_apps_change_percent: yearAppsChangePercent,
  };
}

// 获取年度趋势数据
// 获取年度趋势数据（按应用数量统计，去重）
export async function getYearlyAppTrend() {
  const { data, error } = await supabase
    .from('cases')
    .select('report_date, app_name');
  
  if (error) throw error;
  
  const yearApps: Record<string, Set<string>> = {};
  (data || []).forEach(item => {
    const year = item.report_date.substring(0, 4);
    if (!yearApps[year]) {
      yearApps[year] = new Set();
    }
    yearApps[year].add(item.app_name);
  });

  return Object.entries(yearApps)
    .map(([year, apps]) => ({ year, count: apps.size }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

// 获取月度趋势数据（按应用数量统计，去重）
export async function getMonthlyAppTrend(year?: string) {
  let query = supabase.from('cases').select('report_date, app_name');
  
  if (year) {
    query = query.gte('report_date', `${year}-01-01`).lte('report_date', `${year}-12-31`);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  const monthApps: Record<string, Set<string>> = {};
  (data || []).forEach(item => {
    const month = item.report_date.substring(0, 7);
    if (!monthApps[month]) {
      monthApps[month] = new Set();
    }
    monthApps[month].add(item.app_name);
  });

  return Object.entries(monthApps)
    .map(([month, apps]) => ({ month, count: apps.size }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// 获取年度通报频次趋势（按部门+日期去重）
export async function getYearlyReportTrend() {
  const { data, error } = await supabase
    .from('cases')
    .select('report_date, department_id');
  
  if (error) throw error;
  
  const yearReports: Record<string, Set<string>> = {};
  (data || []).forEach(item => {
    const year = item.report_date.substring(0, 4);
    if (!yearReports[year]) {
      yearReports[year] = new Set();
    }
    const key = `${item.department_id}_${item.report_date}`;
    yearReports[year].add(key);
  });

  return Object.entries(yearReports)
    .map(([year, reports]) => ({ year, count: reports.size }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

// 获取月度通报频次趋势（按部门+日期去重）
export async function getMonthlyReportTrend(year?: string) {
  let query = supabase.from('cases').select('report_date, department_id');
  
  if (year) {
    query = query.gte('report_date', `${year}-01-01`).lte('report_date', `${year}-12-31`);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  const monthReports: Record<string, Set<string>> = {};
  (data || []).forEach(item => {
    const month = item.report_date.substring(0, 7);
    if (!monthReports[month]) {
      monthReports[month] = new Set();
    }
    const key = `${item.department_id}_${item.report_date}`;
    monthReports[month].add(key);
  });

  return Object.entries(monthReports)
    .map(([month, reports]) => ({ month, count: reports.size }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// 获取年度趋势数据（原有的，保留用于兼容）
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

// 获取月度趋势数据（原有的，保留用于兼容）
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

// 获取每月被通报的应用数量趋势
export async function getMonthlyAppCountTrend(year?: string) {
  let query = supabase.from('cases').select('report_date, app_name');
  
  if (year) {
    query = query.gte('report_date', `${year}-01-01`).lte('report_date', `${year}-12-31`);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  // 按月份分组，统计每月不同的应用数量
  const monthAppSets: Record<string, Set<string>> = {};
  (data || []).forEach(item => {
    const month = item.report_date.substring(0, 7);
    if (!monthAppSets[month]) {
      monthAppSets[month] = new Set();
    }
    if (item.app_name) {
      monthAppSets[month].add(item.app_name);
    }
  });

  return Object.entries(monthAppSets)
    .map(([month, appSet]) => ({ month, count: appSet.size }))
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

export async function batchUpdateFooterSettings(updates: { id: string; display_order?: number; is_active?: boolean }[]) {
  const promises = updates.map(update =>
    supabase
      .from('footer_settings')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', update.id)
  );
  
  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw new Error('批量更新失败');
  }
}

// ============ 多维度关联分析 ============

/**
 * 获取部门-年度-月度通报频次分析数据
 * @param departmentIds 部门ID数组（可选，为空则查询所有部门）
 * @param startYear 开始年份（可选）
 * @param endYear 结束年份（可选）
 * @returns 部门-时间维度的通报频次数据
 */
export async function getDepartmentTimeTrend(
  departmentIds?: string[],
  startYear?: string,
  endYear?: string
) {
  let query = supabase
    .from('cases')
    .select(`
      report_date,
      department_id,
      department:regulatory_departments(id, name)
    `);

  // 应用部门筛选
  if (departmentIds && departmentIds.length > 0) {
    query = query.in('department_id', departmentIds);
  }

  // 应用年份筛选
  if (startYear) {
    query = query.gte('report_date', `${startYear}-01-01`);
  }
  if (endYear) {
    query = query.lte('report_date', `${endYear}-12-31`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // 数据结构：{ departmentId: { departmentName: string, years: { year: { months: { month: count } } } } }
  const result: Record<string, {
    departmentName: string;
    years: Record<string, {
      total: number;
      months: Record<string, number>;
    }>;
  }> = {};

  // 用于去重的Set：部门+日期
  const reportKeys = new Set<string>();

  (data || []).forEach(item => {
    if (!item.department_id || !item.department) return;

    const deptId = item.department_id;
    const deptName = (item.department as any).name;
    const year = item.report_date.substring(0, 4);
    const month = item.report_date.substring(5, 7);
    const reportKey = `${deptId}_${item.report_date}`;

    // 去重：同一部门同一天只算一次
    if (reportKeys.has(reportKey)) return;
    reportKeys.add(reportKey);

    // 初始化部门数据
    if (!result[deptId]) {
      result[deptId] = {
        departmentName: deptName,
        years: {},
      };
    }

    // 初始化年份数据
    if (!result[deptId].years[year]) {
      result[deptId].years[year] = {
        total: 0,
        months: {},
      };
    }

    // 初始化月份数据
    if (!result[deptId].years[year].months[month]) {
      result[deptId].years[year].months[month] = 0;
    }

    // 累加计数
    result[deptId].years[year].months[month]++;
    result[deptId].years[year].total++;
  });

  return result;
}

/**
 * 获取年度部门通报排名
 * @param year 年份
 * @param limit 返回数量限制
 * @returns 部门通报频次排名
 */
export async function getDepartmentYearlyRanking(year: string, limit = 10) {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      report_date,
      department_id,
      department:regulatory_departments(id, name)
    `)
    .gte('report_date', `${year}-01-01`)
    .lte('report_date', `${year}-12-31`);

  if (error) throw error;

  // 统计每个部门的通报次数（去重）
  const deptReports: Record<string, { name: string; dates: Set<string> }> = {};

  (data || []).forEach(item => {
    if (!item.department_id || !item.department) return;

    const deptId = item.department_id;
    const deptName = (item.department as any).name;

    if (!deptReports[deptId]) {
      deptReports[deptId] = {
        name: deptName,
        dates: new Set(),
      };
    }

    deptReports[deptId].dates.add(item.report_date);
  });

  // 转换为数组并排序
  return Object.entries(deptReports)
    .map(([id, info]) => ({
      departmentId: id,
      departmentName: info.name,
      count: info.dates.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * 获取月度部门通报排名
 * @param year 年份
 * @param month 月份（01-12）
 * @param limit 返回数量限制
 * @returns 部门通报频次排名
 */
export async function getDepartmentMonthlyRanking(year: string, month: string, limit = 10) {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      report_date,
      department_id,
      department:regulatory_departments(id, name)
    `)
    .gte('report_date', `${year}-${month}-01`)
    .lte('report_date', `${year}-${month}-31`);

  if (error) throw error;

  // 统计每个部门的通报次数（去重）
  const deptReports: Record<string, { name: string; dates: Set<string> }> = {};

  (data || []).forEach(item => {
    if (!item.department_id || !item.department) return;

    const deptId = item.department_id;
    const deptName = (item.department as any).name;

    if (!deptReports[deptId]) {
      deptReports[deptId] = {
        name: deptName,
        dates: new Set(),
      };
    }

    deptReports[deptId].dates.add(item.report_date);
  });

  // 转换为数组并排序
  return Object.entries(deptReports)
    .map(([id, info]) => ({
      departmentId: id,
      departmentName: info.name,
      count: info.dates.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * 获取多部门对比数据（按月）
 * @param departmentIds 部门ID数组
 * @param year 年份
 * @returns 多部门月度对比数据
 */
export async function getMultiDepartmentComparison(departmentIds: string[], year: string) {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      report_date,
      department_id,
      department:regulatory_departments(id, name)
    `)
    .in('department_id', departmentIds)
    .gte('report_date', `${year}-01-01`)
    .lte('report_date', `${year}-12-31`);

  if (error) throw error;

  // 数据结构：{ departmentId: { name: string, months: { month: count } } }
  const result: Record<string, {
    name: string;
    months: Record<string, number>;
  }> = {};

  // 用于去重的Set：部门+日期
  const reportKeys = new Set<string>();

  (data || []).forEach(item => {
    if (!item.department_id || !item.department) return;

    const deptId = item.department_id;
    const deptName = (item.department as any).name;
    const month = item.report_date.substring(5, 7);
    const reportKey = `${deptId}_${item.report_date}`;

    // 去重：同一部门同一天只算一次
    if (reportKeys.has(reportKey)) return;
    reportKeys.add(reportKey);

    // 初始化部门数据
    if (!result[deptId]) {
      result[deptId] = {
        name: deptName,
        months: {},
      };
    }

    // 初始化月份数据
    if (!result[deptId].months[month]) {
      result[deptId].months[month] = 0;
    }

    // 累加计数
    result[deptId].months[month]++;
  });

  return result;
}

/**
 * 获取高频通报时段分析
 * @param threshold 阈值（通报次数）
 * @returns 高频通报的年月及对应的部门
 */
export async function getHighFrequencyPeriods(threshold = 5) {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      report_date,
      department_id,
      department:regulatory_departments(id, name)
    `);

  if (error) throw error;

  // 数据结构：{ yearMonth: { count: number, departments: { deptId: { name: string, count: number } } } }
  const periods: Record<string, {
    count: number;
    departments: Record<string, { name: string; count: number }>;
  }> = {};

  // 用于去重的Set：部门+日期
  const reportKeys = new Set<string>();

  (data || []).forEach(item => {
    if (!item.department_id || !item.department) return;

    const deptId = item.department_id;
    const deptName = (item.department as any).name;
    const yearMonth = item.report_date.substring(0, 7);
    const reportKey = `${deptId}_${item.report_date}`;

    // 去重：同一部门同一天只算一次
    if (reportKeys.has(reportKey)) return;
    reportKeys.add(reportKey);

    // 初始化时段数据
    if (!periods[yearMonth]) {
      periods[yearMonth] = {
        count: 0,
        departments: {},
      };
    }

    // 初始化部门数据
    if (!periods[yearMonth].departments[deptId]) {
      periods[yearMonth].departments[deptId] = {
        name: deptName,
        count: 0,
      };
    }

    // 累加计数
    periods[yearMonth].count++;
    periods[yearMonth].departments[deptId].count++;
  });

  // 筛选高频时段
  return Object.entries(periods)
    .filter(([, info]) => info.count >= threshold)
    .map(([yearMonth, info]) => ({
      yearMonth,
      totalCount: info.count,
      departments: Object.entries(info.departments)
        .map(([id, dept]) => ({
          departmentId: id,
          departmentName: dept.name,
          count: dept.count,
        }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

// ============ 违规问题分析 ============

/**
 * 提取违规问题关键词
 * @param violationContent 违规内容文本
 * @returns 违规问题关键词数组
 */
function extractViolationKeywords(violationContent: string): string[] {
  if (!violationContent || violationContent === '未提供违规内容') return [];

  const keywords: string[] = [];
  
  // 常见违规问题关键词模式
  const patterns = [
    /违规(收集|使用|处理|共享|传输).*?(个人信息|用户信息|隐私信息)/g,
    /未(经|经过|经用户)同意.*?(收集|使用|处理|共享)/g,
    /超范围(收集|使用|处理)/g,
    /强制.*?授权/g,
    /频繁.*?申请.*?权限/g,
    /过度.*?(索取|收集).*?权限/g,
    /未(提供|明示).*?(隐私政策|用户协议)/g,
    /未(公开|公示).*?(收集|使用)规则/g,
    /未(提供|设置).*?(注销|删除|撤回).*?功能/g,
    /未(经|经过).*?同意.*?(推送|发送).*?(信息|消息|广告)/g,
    /欺骗.*?误导.*?用户/g,
    /诱导.*?用户/g,
    /违规.*?(广告|推送|弹窗)/g,
    /恶意.*?(吸费|扣费)/g,
    /私自.*?(下载|安装|调用)/g,
    /捆绑.*?安装/g,
    /强制.*?更新/g,
    /违规.*?SDK/g,
    /第三方.*?SDK.*?违规/g,
    /未经.*?许可.*?(调用|使用).*?接口/g,
  ];

  patterns.forEach(pattern => {
    const matches = violationContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // 清理和标准化关键词
        let keyword = match.trim();
        // 限制长度
        if (keyword.length > 30) {
          keyword = keyword.substring(0, 30) + '...';
        }
        if (keyword && !keywords.includes(keyword)) {
          keywords.push(keyword);
        }
      });
    }
  });

  // 如果没有匹配到关键词，尝试提取简短的句子
  if (keywords.length === 0) {
    const sentences = violationContent.split(/[。；;]/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length <= 50) {
        keywords.push(firstSentence);
      } else {
        keywords.push(firstSentence.substring(0, 50) + '...');
      }
    }
  }

  return keywords;
}

/**
 * 获取违规问题类型统计
 * @param departmentIds 部门ID数组（可选）
 * @param startDate 开始日期（可选）
 * @param endDate 结束日期（可选）
 * @returns 违规问题类型统计数据
 */
export async function getViolationTypeAnalysis(
  departmentIds?: string[],
  startDate?: string,
  endDate?: string
) {
  let query = supabase
    .from('cases')
    .select('violation_content, report_date, department_id');

  // 应用筛选条件
  if (departmentIds && departmentIds.length > 0) {
    query = query.in('department_id', departmentIds);
  }
  if (startDate) {
    query = query.gte('report_date', startDate);
  }
  if (endDate) {
    query = query.lte('report_date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  // 统计违规问题类型
  const typeCount: Record<string, number> = {};
  
  (data || []).forEach(item => {
    const keywords = extractViolationKeywords(item.violation_content || '');
    keywords.forEach(keyword => {
      typeCount[keyword] = (typeCount[keyword] || 0) + 1;
    });
  });

  // 转换为数组并排序
  return Object.entries(typeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 获取违规问题时间趋势
 * @param departmentIds 部门ID数组（可选）
 * @param year 年份
 * @param granularity 时间粒度（month/day）
 * @returns 违规问题时间趋势数据
 */
export async function getViolationTimeTrend(
  departmentIds: string[] | undefined,
  year: string,
  granularity: 'month' | 'day' = 'month'
) {
  let query = supabase
    .from('cases')
    .select('violation_content, report_date')
    .gte('report_date', `${year}-01-01`)
    .lte('report_date', `${year}-12-31`);

  if (departmentIds && departmentIds.length > 0) {
    query = query.in('department_id', departmentIds);
  }

  const { data, error } = await query;

  if (error) throw error;

  // 按时间粒度统计
  const timeTrend: Record<string, number> = {};

  (data || []).forEach(item => {
    const keywords = extractViolationKeywords(item.violation_content || '');
    if (keywords.length === 0) return;

    let timeKey: string;
    if (granularity === 'month') {
      timeKey = item.report_date.substring(0, 7); // YYYY-MM
    } else {
      timeKey = item.report_date; // YYYY-MM-DD
    }

    timeTrend[timeKey] = (timeTrend[timeKey] || 0) + keywords.length;
  });

  // 转换为数组并排序
  return Object.entries(timeTrend)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * 获取违规问题与部门关联分析
 * @param year 年份
 * @param topN 返回前N个违规问题
 * @returns 违规问题与部门关联数据
 */
export async function getViolationDepartmentAnalysis(year: string, topN = 10) {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      violation_content,
      department_id,
      department:regulatory_departments(id, name)
    `)
    .gte('report_date', `${year}-01-01`)
    .lte('report_date', `${year}-12-31`);

  if (error) throw error;

  // 统计每个违规问题的部门分布
  const violationDeptMap: Record<string, Record<string, { name: string; count: number }>> = {};

  (data || []).forEach(item => {
    if (!item.department_id || !item.department) return;

    const keywords = extractViolationKeywords(item.violation_content || '');
    const deptId = item.department_id;
    const deptName = (item.department as any).name;

    keywords.forEach(keyword => {
      if (!violationDeptMap[keyword]) {
        violationDeptMap[keyword] = {};
      }
      if (!violationDeptMap[keyword][deptId]) {
        violationDeptMap[keyword][deptId] = { name: deptName, count: 0 };
      }
      violationDeptMap[keyword][deptId].count++;
    });
  });

  // 计算每个违规问题的总数并排序
  const violationTotals = Object.entries(violationDeptMap).map(([violation, depts]) => {
    const total = Object.values(depts).reduce((sum, dept) => sum + dept.count, 0);
    return { violation, total, departments: depts };
  });

  violationTotals.sort((a, b) => b.total - a.total);

  // 返回前N个违规问题及其部门分布
  return violationTotals.slice(0, topN).map(item => ({
    violation: item.violation,
    total: item.total,
    departments: Object.entries(item.departments)
      .map(([id, dept]) => ({
        departmentId: id,
        departmentName: dept.name,
        count: dept.count,
      }))
      .sort((a, b) => b.count - a.count),
  }));
}

/**
 * 获取违规问题严重程度分析（基于频次）
 * @param year 年份
 * @returns 违规问题严重程度分级数据
 */
export async function getViolationSeverityAnalysis(year: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('violation_content')
    .gte('report_date', `${year}-01-01`)
    .lte('report_date', `${year}-12-31`);

  if (error) throw error;

  // 统计违规问题频次
  const violationCount: Record<string, number> = {};

  (data || []).forEach(item => {
    const keywords = extractViolationKeywords(item.violation_content || '');
    keywords.forEach(keyword => {
      violationCount[keyword] = (violationCount[keyword] || 0) + 1;
    });
  });

  // 计算分级阈值
  const counts = Object.values(violationCount);
  if (counts.length === 0) {
    return { high: [], medium: [], low: [] };
  }

  const maxCount = Math.max(...counts);
  const highThreshold = maxCount * 0.6; // 高频：超过最大值的60%
  const mediumThreshold = maxCount * 0.3; // 中频：超过最大值的30%

  // 分级
  const high: Array<{ violation: string; count: number }> = [];
  const medium: Array<{ violation: string; count: number }> = [];
  const low: Array<{ violation: string; count: number }> = [];

  Object.entries(violationCount).forEach(([violation, count]) => {
    const item = { violation, count };
    if (count >= highThreshold) {
      high.push(item);
    } else if (count >= mediumThreshold) {
      medium.push(item);
    } else {
      low.push(item);
    }
  });

  // 排序
  high.sort((a, b) => b.count - a.count);
  medium.sort((a, b) => b.count - a.count);
  low.sort((a, b) => b.count - a.count);

  return { high, medium, low };
}

/**
 * 导出违规问题分析数据
 * @param departmentIds 部门ID数组（可选）
 * @param startDate 开始日期（可选）
 * @param endDate 结束日期（可选）
 * @returns 完整的违规问题分析数据
 */
export async function exportViolationAnalysis(
  departmentIds?: string[],
  startDate?: string,
  endDate?: string
) {
  let query = supabase
    .from('cases')
    .select(`
      id,
      report_date,
      app_name,
      app_developer,
      violation_content,
      department:regulatory_departments(name),
      platform:app_platforms(name)
    `);

  if (departmentIds && departmentIds.length > 0) {
    query = query.in('department_id', departmentIds);
  }
  if (startDate) {
    query = query.gte('report_date', startDate);
  }
  if (endDate) {
    query = query.lte('report_date', endDate);
  }

  const { data, error } = await query.order('report_date', { ascending: false });

  if (error) throw error;

  // 处理数据，提取违规问题关键词
  return (data || []).map(item => ({
    id: item.id,
    report_date: item.report_date,
    app_name: item.app_name,
    app_developer: item.app_developer || '未知',
    department: (item.department as any)?.name || '未知',
    platform: (item.platform as any)?.name || '未知',
    violation_content: item.violation_content || '未提供违规内容',
    violation_keywords: extractViolationKeywords(item.violation_content || '').join('; '),
  }));
}

// ==================== 模块设置管理 ====================

/**
 * 获取所有模块设置
 * @returns 模块设置列表
 */
export async function getModuleSettings(): Promise<ModuleSetting[]> {
  const { data, error } = await supabase
    .from('module_settings')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('获取模块设置失败:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

/**
 * 更新模块设置状态
 * @param moduleKey 模块标识符
 * @param isEnabled 是否启用
 */
export async function updateModuleSetting(moduleKey: string, isEnabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('module_settings')
    .update({ is_enabled: isEnabled })
    .eq('module_key', moduleKey);

  if (error) {
    console.error('更新模块设置失败:', error);
    throw error;
  }
}

/**
 * 获取启用的模块列表（用于前台）
 * @returns 启用的模块键值对 { moduleKey: true }
 */
export async function getEnabledModules(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('module_settings')
    .select('module_key, is_enabled')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('获取启用模块失败:', error);
    // 返回默认值，所有模块都启用
    return {
      cases: true,
      news: true,
      departments: true,
      trends: true,
      issues: true,
    };
  }

  // 转换为键值对格式
  const modules: Record<string, boolean> = {};
  (data || []).forEach(item => {
    modules[item.module_key] = item.is_enabled;
  });

  return modules;
}

// ============ 网站基本信息配置 ============

/**
 * 获取网站基本信息配置
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

/**
 * 更新网站基本信息配置
 */
export async function updateSiteSettings(id: string, updates: Partial<SiteSettings>) {
  const { data, error } = await supabase
    .from('site_settings')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

/**
 * 上传Logo图片到Supabase Storage
 * @param file 图片文件
 * @returns 图片的公开URL
 */
export async function uploadLogo(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `logo-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('app-800go8thhcsh_logos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('app-800go8thhcsh_logos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * 删除Logo图片
 * @param url Logo图片URL
 */
export async function deleteLogo(url: string) {
  // 从URL中提取文件路径
  const urlParts = url.split('/');
  const fileName = urlParts[urlParts.length - 1];

  const { error } = await supabase.storage
    .from('app-800go8thhcsh_logos')
    .remove([fileName]);

  if (error) throw error;
}

/*
# 增强高频问题分析 - 语义拆分功能

## 功能说明
升级高频问题分析RPC函数，增加对复合违规描述的智能拆分能力。

## 核心改进
1. **语义拆分规则**
   - 识别并拆分以中文分号"；"连接的复合问题
   - 识别并拆分以中文顿号"、"连接的并列问题（可选）
   - 自动清理拆分后的空白字符
   - 过滤空字符串

2. **拆分示例**
   - 输入："超范围收集个人信息；SDK信息公示不到位"
   - 输出：["超范围收集个人信息", "SDK信息公示不到位"]
   
   - 输入："违规收集个人信息；APP强制、频繁、过度索取权限"
   - 输出：["违规收集个人信息", "APP强制、频繁、过度索取权限"]

3. **统计逻辑**
   - 拆分后的每个独立问题作为最小统计单元
   - 重新计算频次和占比
   - 按频次降序排列

## 技术实现
- 使用PostgreSQL的regexp_split_to_table函数按分号拆分
- 使用unnest和string_to_array处理数组
- 使用TRIM清理空白字符
- 使用WHERE过滤空字符串

## 注意事项
- 保持API接口不变，确保前端兼容
- 拆分规则可根据实际数据情况调整
- 建议定期审查拆分效果，优化规则
*/

-- 删除旧函数
DROP FUNCTION IF EXISTS get_high_frequency_issues(uuid, text, integer, integer, integer);

-- 创建增强版高频问题分析RPC函数（支持语义拆分）
CREATE OR REPLACE FUNCTION get_high_frequency_issues(
  p_department_id uuid DEFAULT NULL,
  p_dimension text DEFAULT 'all',
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  violation_issue text,
  frequency bigint,
  percentage numeric
) 
LANGUAGE sql
STABLE
AS $$
  WITH filtered_cases AS (
    -- 第一步：筛选符合条件的案例
    SELECT 
      violation_content
    FROM cases
    WHERE 
      violation_content IS NOT NULL 
      AND violation_content != ''
      -- 部门筛选
      AND (p_department_id IS NULL OR department_id = p_department_id)
      -- 维度筛选
      AND (
        p_dimension = 'all' 
        OR (p_dimension = 'yearly' AND EXTRACT(YEAR FROM report_date) = p_year)
        OR (p_dimension = 'monthly' AND EXTRACT(YEAR FROM report_date) = p_year AND EXTRACT(MONTH FROM report_date) = p_month)
      )
  ),
  split_issues AS (
    -- 第二步：按中文分号拆分复合问题
    SELECT 
      TRIM(unnest(string_to_array(violation_content, '；'))) as issue
    FROM filtered_cases
  ),
  cleaned_issues AS (
    -- 第三步：清理空字符串和无效数据
    SELECT issue
    FROM split_issues
    WHERE 
      issue IS NOT NULL 
      AND issue != ''
      AND LENGTH(issue) > 0
  ),
  issue_counts AS (
    -- 第四步：统计每个独立问题的频次
    SELECT 
      issue,
      COUNT(*) as freq
    FROM cleaned_issues
    GROUP BY issue
  ),
  total_count AS (
    -- 第五步：计算总频次
    SELECT SUM(freq) as total FROM issue_counts
  )
  -- 第六步：计算占比并返回结果
  SELECT 
    ic.issue as violation_issue,
    ic.freq as frequency,
    ROUND((ic.freq::numeric / NULLIF(tc.total, 0) * 100), 2) as percentage
  FROM issue_counts ic
  CROSS JOIN total_count tc
  WHERE tc.total > 0
  ORDER BY ic.freq DESC, ic.issue ASC
  LIMIT p_limit;
$$;

-- 添加函数注释
COMMENT ON FUNCTION get_high_frequency_issues IS '获取高频违规问题统计（支持语义拆分），按中文分号拆分复合问题后统计频次';

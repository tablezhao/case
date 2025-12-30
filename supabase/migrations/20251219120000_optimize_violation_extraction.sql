-- 优化违规关键词提取函数
-- 实现逻辑：先按分号切割，再对片段进行正则提取
-- 目的：统一 Canvas (首页) 和 SVG (分析页) 的统计逻辑

CREATE OR REPLACE FUNCTION extract_violation_keywords(content text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
  keywords text[] := '{}';
  raw_parts text[];
  part text;
  matches text[];
  m text;
  has_match boolean;
  -- 定义正则模式数组
  -- 格式：(标准化描述模式)
  patterns text[] := ARRAY[
    -- 1. 个人信息收集与使用类
    '(违规(收集|使用|处理|共享|传输|存储).*?(个人信息|用户信息|隐私信息|ID|设备信息|通讯录|位置|照片))',
    '(未(经|经过|经用户)同意.*?(收集|使用|处理|共享|提供|上传)(.*?(个人信息|用户信息|隐私信息|ID|设备信息|通讯录|位置|照片))?)',
    '(超范围(收集|使用|处理))',
    '(过度(索取|收集).*?权限)',
    
    -- 2. 权限获取类
    '(强制.*?(授权|权限))',
    '(频繁.*?申请.*?权限)',
    '(频繁.*?(自启动|关联启动))',
    '(私自.*?(收集|获取|调用|使用))',
    
    -- 3. 隐私政策与告知类
    '(未(提供|明示|公开|公示).*?(隐私政策|用户协议|收集规则|使用规则))',
    '(隐私政策.*?难以(访问|阅读))',
    '(未(完整|真实|准确).*?告知)',
    
    -- 4. 用户权益类
    '(未(提供|设置).*?(注销|删除|撤回|更正|投诉).*?功能)',
    '(欺骗.*?误导.*?用户)',
    '(诱导.*?用户.*?(点击|下载|安装))',
    
    -- 5. 广告与推送类
    '(违规.*?(广告|推送|弹窗))',
    '(未(经|经过).*?同意.*?(推送|发送).*?(信息|消息|广告))',
    '(弹窗.*?无法(关闭|消除))',
    
    -- 6. 费用与扣费类
    '(恶意.*?(吸费|扣费))',
    '(自动.*?(扣费|续费))',
    
    -- 7. 软件安装与行为类
    '(私自.*?(下载|安装))',
    '(捆绑.*?安装)',
    '(强制.*?更新)',
    '(静默.*?(下载|安装))',
    
    -- 8. 第三方SDK类
    '(违规.*?SDK)',
    '(第三方.*?SDK.*?违规)',
    '(未经.*?许可.*?(调用|使用).*?接口)'
  ];
  p text;
BEGIN
  -- 1. 基础校验
  IF content IS NULL OR content = '未提供违规内容' OR trim(content) = '' THEN
    RETURN keywords;
  END IF;

  -- 2. 文本预处理与切割
  -- 将中文分号替换为英文分号，统一分割
  -- 同时处理可能的新行符
  raw_parts := regexp_split_to_array(
    replace(replace(content, '；', ';'), E'\n', ';'),
    '[;]'
  );

  -- 3. 遍历处理每个文本片段
  FOREACH part IN ARRAY raw_parts LOOP
    part := trim(part);
    
    -- 跳过空片段或过短的片段
    IF part = '' OR length(part) < 4 THEN 
      CONTINUE; 
    END IF;

    has_match := false;

    -- 4. 正则匹配标准化
    FOREACH p IN ARRAY patterns LOOP
      -- 使用正则匹配
      FOR matches IN SELECT regexp_matches(part, p, 'g') LOOP
         m := matches[1];
         
         -- 长度保护（避免正则匹配过多内容）
         IF length(m) > 50 THEN
           m := substring(m from 1 for 50) || '...';
         END IF;
         
         -- 智能补全/标准化 (模拟前端 COMPLIANCE_MAP)
         -- 针对常见的不完整描述进行修正
         IF m = '超范围收集' OR m = '超范围使用' OR m = '超范围处理' THEN
             m := m || '个人信息';
         ELSIF m ~ '^未经.*?同意.*?收集$' OR m ~ '^未经.*?同意.*?使用$' THEN
             m := m || '个人信息';
         ELSIF m = '强制授权' OR m = '强制索取权限' THEN
             m := '强制用户授权非必要权限';
         ELSIF m = '未明示收集规则' OR m = '未公开收集规则' THEN
             m := '未明示收集使用个人信息的规则';
         ELSIF m = '未提供注销功能' THEN
             m := '未提供账号注销功能';
         END IF;

         -- 添加到结果集（去重在最后做）
         keywords := array_append(keywords, m);
         has_match := true;
      END LOOP;
      
      -- 如果当前模式已匹配，是否继续匹配其他模式？
      -- 策略：一个片段可能包含多个问题，继续匹配
    END LOOP;

    -- 5. 异常处理/兜底策略
    -- 如果该片段没有匹配任何已知模式，但看起来像是一个完整的描述
    IF NOT has_match THEN
      -- 记录未匹配的片段（这里选择保留原文本，以便后续统计发现）
      -- 加上特殊标记可能有助于开发人员发现，但会影响用户体验。
      -- 决定：直接返回清理后的原片段，作为“其他/未分类”问题参与统计
      IF length(part) <= 50 THEN
        keywords := array_append(keywords, part);
      END IF;
    END IF;
  END LOOP;

  -- 6. 结果去重
  SELECT ARRAY(SELECT DISTINCT unnest(keywords)) INTO keywords;

  RETURN keywords;
END;
$$;

-- 重新创建或更新依赖此函数的 RPC
-- 确保 get_violation_type_analysis 使用新逻辑
CREATE OR REPLACE FUNCTION get_violation_type_analysis(
  department_ids text[] DEFAULT null,
  start_date text DEFAULT null,
  end_date text DEFAULT null
)
RETURNS TABLE (
  type text,
  count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_cases AS (
    SELECT violation_keywords
    FROM cases
    WHERE
      (department_ids IS NULL OR department_id = ANY(department_ids::uuid[]))
      AND (start_date IS NULL OR report_date >= start_date::date)
      AND (end_date IS NULL OR report_date <= end_date::date)
      AND violation_keywords IS NOT NULL
  ),
  extracted_keywords AS (
    SELECT unnest(violation_keywords) as keyword
    FROM filtered_cases
  )
  SELECT
    keyword as type,
    count(*) as count
  FROM extracted_keywords
  WHERE keyword IS NOT NULL AND keyword != ''
  GROUP BY keyword
  ORDER BY count DESC;
END;
$$;

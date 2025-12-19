-- Create a helper function to extract violation keywords
-- This mimics the logic in src/db/api.ts extractViolationKeywords function

CREATE OR REPLACE FUNCTION extract_violation_keywords(content text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
  keywords text[] := '{}';
  matches text[];
  m text;
  -- Define patterns exactly as in the JS code
  -- Note: We wrap each pattern in outer parentheses to ensure the full match is captured as the first element
  patterns text[] := ARRAY[
    '(违规(收集|使用|处理|共享|传输).*?(个人信息|用户信息|隐私信息))',
    '(未(经|经过|经用户)同意.*?(收集|使用|处理|共享))',
    '(超范围(收集|使用|处理))',
    '(强制.*?授权)',
    '(频繁.*?申请.*?权限)',
    '(过度.*?(索取|收集).*?权限)',
    '(未(提供|明示).*?(隐私政策|用户协议))',
    '(未(公开|公示).*?(收集|使用)规则)',
    '(未(提供|设置).*?(注销|删除|撤回).*?功能)',
    '(未(经|经过).*?同意.*?(推送|发送).*?(信息|消息|广告))',
    '(欺骗.*?误导.*?用户)',
    '(诱导.*?用户)',
    '(违规.*?(广告|推送|弹窗))',
    '(恶意.*?(吸费|扣费))',
    '(私自.*?(下载|安装|调用))',
    '(捆绑.*?安装)',
    '(强制.*?更新)',
    '(违规.*?SDK)',
    '(第三方.*?SDK.*?违规)',
    '(未经.*?许可.*?(调用|使用).*?接口)'
  ];
  p text;
  sentences text[];
  first_sentence text;
BEGIN
  IF content IS NULL OR content = '未提供违规内容' OR trim(content) = '' THEN
    RETURN keywords;
  END IF;

  -- Iterate through patterns
  FOREACH p IN ARRAY patterns LOOP
    -- Use a sub-block to handle the loop over matches
    BEGIN
      FOR matches IN SELECT regexp_matches(content, p, 'g') LOOP
         -- matches[1] is the full match because we wrapped the pattern in (...)
         m := matches[1];
         
         -- Trim
         m := trim(m);
         
         -- Limit length to 30 chars (and add ellipsis if needed)
         IF length(m) > 30 THEN
           m := substring(m from 1 for 30) || '...';
         END IF;
         
         -- Add to keywords if not already present (deduplication)
         IF m IS NOT NULL AND m <> '' AND NOT (m = ANY(keywords)) THEN
           keywords := array_append(keywords, m);
         END IF;
      END LOOP;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore regex errors if any
    END;
  END LOOP;

  -- Fallback logic: if no keywords found, extract first sentence
  IF array_length(keywords, 1) IS NULL THEN
    -- Split by punctuation (Chinese period, semicolon, English semicolon)
    sentences := regexp_split_to_array(content, '[。；;]');
    
    -- Find first non-empty sentence
    IF array_length(sentences, 1) > 0 THEN
      FOREACH m IN ARRAY sentences LOOP
        IF trim(m) <> '' THEN
          first_sentence := trim(m);
          EXIT; -- Break after finding the first one
        END IF;
      END LOOP;
      
      IF first_sentence IS NOT NULL THEN
        IF length(first_sentence) <= 50 THEN
          keywords := array_append(keywords, first_sentence);
        ELSE
          keywords := array_append(keywords, substring(first_sentence from 1 for 50) || '...');
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN keywords;
END;
$$;

-- Create the RPC function for violation type analysis
-- This replaces the client-side pagination and aggregation
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
    SELECT violation_content
    FROM cases
    WHERE
      (department_ids IS NULL OR department_id = ANY(department_ids::uuid[]))
      AND (start_date IS NULL OR report_date >= start_date::date)
      AND (end_date IS NULL OR report_date <= end_date::date)
  ),
  extracted_keywords AS (
    SELECT unnest(extract_violation_keywords(violation_content)) as keyword
    FROM filtered_cases
  )
  SELECT
    keyword as type,
    count(*) as count
  FROM extracted_keywords
  GROUP BY keyword
  ORDER BY count DESC;
END;
$$;

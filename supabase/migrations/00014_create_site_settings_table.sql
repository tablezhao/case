/*
# 创建网站基本信息配置表

## 1. 功能说明
为系统管理员提供集中管理网站基本信息的能力，包括：
- 网站主标题
- 网站备用名称/简称
- 网站Logo图片URL

## 2. 新建表

### `site_settings` 表
存储网站的基本配置信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | uuid | 主键，默认生成 |
| site_title | text | 网站主标题，必填，最大200字符 |
| site_subtitle | text | 网站备用名称/简称，可选，最大100字符 |
| logo_url | text | Logo图片URL，可选 |
| created_at | timestamptz | 创建时间，自动生成 |
| updated_at | timestamptz | 更新时间，自动更新 |

## 3. 安全策略
- 启用RLS（行级安全）
- 所有用户可读取配置（用于前台展示）
- 仅管理员可修改配置

## 4. 初始数据
插入默认配置记录，确保系统始终有一条配置数据

## 5. 存储桶
创建logo存储桶，用于上传Logo图片
- 桶名：app-800go8thhcsh_logos
- 公开访问
- 文件大小限制：2MB
- 允许的MIME类型：image/png, image/jpeg, image/svg+xml
*/

-- 创建网站基本信息配置表
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title text NOT NULL CHECK (char_length(site_title) <= 200),
  site_subtitle text CHECK (char_length(site_subtitle) <= 100),
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_site_settings_updated_at ON site_settings(updated_at DESC);

-- 启用行级安全
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 所有用户可读取配置（用于前台展示）
CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  USING (true);

-- 仅管理员可插入配置
CREATE POLICY "Only admins can insert site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- 仅管理员可更新配置
CREATE POLICY "Only admins can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 仅管理员可删除配置
CREATE POLICY "Only admins can delete site settings"
  ON site_settings FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- 插入默认配置
INSERT INTO site_settings (site_title, site_subtitle, logo_url)
VALUES (
  '合规通',
  'App监管案例查询平台',
  NULL
)
ON CONFLICT DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION update_site_settings_updated_at();

-- 创建Logo存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-800go8thhcsh_logos',
  'app-800go8thhcsh_logos',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 存储桶访问策略：所有人可读
CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-800go8thhcsh_logos');

-- 存储桶访问策略：仅管理员可上传
CREATE POLICY "Only admins can upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'app-800go8thhcsh_logos' 
    AND is_admin(auth.uid())
  );

-- 存储桶访问策略：仅管理员可更新
CREATE POLICY "Only admins can update logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'app-800go8thhcsh_logos' 
    AND is_admin(auth.uid())
  );

-- 存储桶访问策略：仅管理员可删除
CREATE POLICY "Only admins can delete logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'app-800go8thhcsh_logos' 
    AND is_admin(auth.uid())
  );

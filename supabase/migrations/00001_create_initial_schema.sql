/*
# 创建合规通平台初始数据库结构

## 1. 新建表

### 1.1 profiles（用户表）
- `id` (uuid, 主键, 引用 auth.users)
- `username` (text, 唯一, 非空)
- `role` (user_role枚举, 默认'user', 非空)
- `created_at` (timestamptz, 默认now())

### 1.2 regulatory_departments（监管部门表）
- `id` (uuid, 主键, 默认gen_random_uuid())
- `name` (text, 唯一, 非空) - 监管部门全称
- `province` (text) - 所在省份
- `city` (text) - 所在城市
- `created_at` (timestamptz, 默认now())

### 1.3 app_platforms（应用平台表）
- `id` (uuid, 主键, 默认gen_random_uuid())
- `name` (text, 唯一, 非空) - 平台名称（如：App Store、华为应用市场等）
- `created_at` (timestamptz, 默认now())

### 1.4 cases（案例主表）
- `id` (uuid, 主键, 默认gen_random_uuid())
- `report_date` (date, 非空) - 通报发布日期
- `app_name` (text, 非空) - 被通报应用名称
- `app_developer` (text) - 应用开发者/运营者
- `department_id` (uuid, 外键引用regulatory_departments) - 监管部门ID
- `platform_id` (uuid, 外键引用app_platforms) - 应用平台ID
- `violation_summary` (text) - 违规问题摘要
- `violation_detail` (text) - 详细违规内容
- `source_url` (text) - 原文链接
- `created_at` (timestamptz, 默认now())
- `updated_at` (timestamptz, 默认now())

### 1.5 regulatory_news（监管资讯表）
- `id` (uuid, 主键, 默认gen_random_uuid())
- `publish_date` (date, 非空) - 发布日期
- `department_id` (uuid, 外键引用regulatory_departments) - 监管部门ID
- `title` (text, 非空) - 资讯标题
- `summary` (text) - 资讯摘要
- `content` (text) - 详细内容
- `source_url` (text) - 原文链接
- `created_at` (timestamptz, 默认now())
- `updated_at` (timestamptz, 默认now())

### 1.6 frontend_config（前端配置表）
- `id` (uuid, 主键, 默认gen_random_uuid())
- `module_key` (text, 唯一, 非空) - 模块标识
- `module_name` (text, 非空) - 模块名称
- `is_visible` (boolean, 默认true) - 是否显示
- `sort_order` (integer, 默认0) - 排序顺序
- `updated_at` (timestamptz, 默认now())

### 1.7 static_content（静态内容表）
- `id` (uuid, 主键, 默认gen_random_uuid())
- `content_key` (text, 唯一, 非空) - 内容标识
- `content_name` (text, 非空) - 内容名称
- `content_html` (text) - HTML内容
- `updated_at` (timestamptz, 默认now())

## 2. 安全策略

### 2.1 用户角色
- 创建user_role枚举类型：'user'（普通用户）、'admin'（管理员）

### 2.2 RLS策略
- profiles表：公开读取，管理员全权限，用户可更新自己的信息（除role外）
- regulatory_departments表：公开读取，管理员可写
- app_platforms表：公开读取，管理员可写
- cases表：公开读取，管理员可写
- regulatory_news表：公开读取，管理员可写
- frontend_config表：公开读取，管理员可写
- static_content表：公开读取，管理员可写

### 2.3 触发器
- 创建handle_new_user函数，当用户验证后自动同步到profiles表
- 第一个注册用户自动设为admin

## 3. 初始数据
- 插入默认前端配置模块
- 插入默认静态内容
*/

-- 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 1. profiles表
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. regulatory_departments表
CREATE TABLE IF NOT EXISTS regulatory_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  province text,
  city text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE regulatory_departments ENABLE ROW LEVEL SECURITY;

-- 3. app_platforms表
CREATE TABLE IF NOT EXISTS app_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_platforms ENABLE ROW LEVEL SECURITY;

-- 4. cases表
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL,
  app_name text NOT NULL,
  app_developer text,
  department_id uuid REFERENCES regulatory_departments(id) ON DELETE SET NULL,
  platform_id uuid REFERENCES app_platforms(id) ON DELETE SET NULL,
  violation_summary text,
  violation_detail text,
  source_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cases_report_date ON cases(report_date DESC);
CREATE INDEX idx_cases_department_id ON cases(department_id);
CREATE INDEX idx_cases_platform_id ON cases(platform_id);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- 5. regulatory_news表
CREATE TABLE IF NOT EXISTS regulatory_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_date date NOT NULL,
  department_id uuid REFERENCES regulatory_departments(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text,
  content text,
  source_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_regulatory_news_publish_date ON regulatory_news(publish_date DESC);

ALTER TABLE regulatory_news ENABLE ROW LEVEL SECURITY;

-- 6. frontend_config表
CREATE TABLE IF NOT EXISTS frontend_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text UNIQUE NOT NULL,
  module_name text NOT NULL,
  is_visible boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE frontend_config ENABLE ROW LEVEL SECURITY;

-- 7. static_content表
CREATE TABLE IF NOT EXISTS static_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text UNIQUE NOT NULL,
  content_name text NOT NULL,
  content_html text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE static_content ENABLE ROW LEVEL SECURITY;

-- 创建is_admin辅助函数
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- 创建用户自动同步触发器函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- 从email中提取用户名（去掉@miaoda.com）
  extracted_username := REPLACE(NEW.email, '@miaoda.com', '');
  
  INSERT INTO profiles (id, username, role)
  VALUES (
    NEW.id,
    extracted_username,
    CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'user'::user_role END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- RLS策略 - profiles表
CREATE POLICY "所有人可查看profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "管理员对profiles有全部权限" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可更新自己的profile（除role外）" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- RLS策略 - regulatory_departments表
CREATE POLICY "所有人可查看监管部门" ON regulatory_departments
  FOR SELECT USING (true);

CREATE POLICY "管理员可管理监管部门" ON regulatory_departments
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS策略 - app_platforms表
CREATE POLICY "所有人可查看应用平台" ON app_platforms
  FOR SELECT USING (true);

CREATE POLICY "管理员可管理应用平台" ON app_platforms
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS策略 - cases表
CREATE POLICY "所有人可查看案例" ON cases
  FOR SELECT USING (true);

CREATE POLICY "管理员可管理案例" ON cases
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS策略 - regulatory_news表
CREATE POLICY "所有人可查看监管资讯" ON regulatory_news
  FOR SELECT USING (true);

CREATE POLICY "管理员可管理监管资讯" ON regulatory_news
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS策略 - frontend_config表
CREATE POLICY "所有人可查看前端配置" ON frontend_config
  FOR SELECT USING (true);

CREATE POLICY "管理员可管理前端配置" ON frontend_config
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS策略 - static_content表
CREATE POLICY "所有人可查看静态内容" ON static_content
  FOR SELECT USING (true);

CREATE POLICY "管理员可管理静态内容" ON static_content
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 插入默认前端配置
INSERT INTO frontend_config (module_key, module_name, is_visible, sort_order) VALUES
  ('stats_overview', '核心数据总览', true, 1),
  ('trend_chart', '年度月度趋势图', true, 2),
  ('geo_map', '地理分布地图', true, 3),
  ('department_chart', '部门频次分布', true, 4),
  ('platform_chart', '平台分布图', true, 5),
  ('wordcloud', '违规问题词云', true, 6),
  ('recent_news', '近期监管资讯', true, 7);

-- 插入默认静态内容
INSERT INTO static_content (content_key, content_name, content_html) VALUES
  ('home_intro', '首页介绍', '<p>欢迎使用合规通 - App监管案例查询平台</p><p>本平台致力于提供信息透明、查询便捷的监管案例和资讯服务。</p>'),
  ('about', '关于我们', '<p>合规通是一个专业的App监管案例查询平台。</p>'),
  ('contact', '联系方式', '<p>如有问题，请联系管理员。</p>');
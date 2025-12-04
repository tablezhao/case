/*
# 创建页脚配置管理表

## 用途
用于存储网站页脚的各个模块配置，支持后台动态管理

## 表结构
- `footer_settings` 表
  - `id` (uuid, 主键)
  - `section` (text, 模块标识: about/navigation/links/newsletter/social/copyright/filing)
  - `title` (text, 模块标题)
  - `content` (jsonb, 模块内容，JSON格式存储)
  - `display_order` (integer, 显示顺序)
  - `is_active` (boolean, 是否启用)
  - `created_at` (timestamptz, 创建时间)
  - `updated_at` (timestamptz, 更新时间)

## 安全策略
- 所有用户可以读取（前台展示）
- 仅管理员可以修改
*/

-- 创建页脚配置表
CREATE TABLE IF NOT EXISTS footer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL UNIQUE,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_footer_settings_section ON footer_settings(section);
CREATE INDEX idx_footer_settings_display_order ON footer_settings(display_order);
CREATE INDEX idx_footer_settings_is_active ON footer_settings(is_active);

-- 启用RLS
ALTER TABLE footer_settings ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取启用的配置
CREATE POLICY "所有人可以读取启用的页脚配置"
ON footer_settings FOR SELECT
TO public
USING (is_active = true);

-- 管理员可以查看所有配置
CREATE POLICY "管理员可以查看所有页脚配置"
ON footer_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

-- 管理员可以插入配置
CREATE POLICY "管理员可以插入页脚配置"
ON footer_settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

-- 管理员可以更新配置
CREATE POLICY "管理员可以更新页脚配置"
ON footer_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

-- 管理员可以删除配置
CREATE POLICY "管理员可以删除页脚配置"
ON footer_settings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

-- 插入默认配置数据
INSERT INTO footer_settings (section, title, content, display_order, is_active) VALUES
(
  'about',
  '关于合规通',
  '{
    "description": "合规通致力于打造信息透明、查询便捷的App监管案例平台，汇集各级网络监管部门发布的违规案例和监管资讯，助力企业合规发展，保护用户权益。",
    "email": "contact@compliance.gov.cn"
  }'::jsonb,
  1,
  true
),
(
  'navigation',
  '快速导航',
  '{
    "links": [
      {"name": "首页", "path": "/"},
      {"name": "案例查询", "path": "/cases"},
      {"name": "监管资讯", "path": "/news"},
      {"name": "管理后台", "path": "/login"}
    ]
  }'::jsonb,
  2,
  true
),
(
  'friendly_links',
  '友情链接',
  '{
    "links": [
      {"name": "工业和信息化部", "url": "https://www.miit.gov.cn"},
      {"name": "国家互联网信息办公室", "url": "https://www.cac.gov.cn"},
      {"name": "公安部", "url": "https://www.mps.gov.cn"},
      {"name": "市场监管总局", "url": "https://www.samr.gov.cn"}
    ]
  }'::jsonb,
  3,
  true
),
(
  'social_media',
  '社交媒体',
  '{
    "platforms": [
      {"name": "微信公众号", "icon": "微信", "qrcode": true},
      {"name": "官方微博", "icon": "微博", "url": "#"}
    ]
  }'::jsonb,
  4,
  true
),
(
  'newsletter',
  '订阅资讯',
  '{
    "description": "订阅我们的邮件列表，获取最新监管动态和案例分析",
    "privacy_note": "我们尊重您的隐私，不会向第三方分享您的信息",
    "enabled": true
  }'::jsonb,
  5,
  true
),
(
  'copyright',
  '版权信息',
  '{
    "company_name": "合规通",
    "show_year": true
  }'::jsonb,
  6,
  true
),
(
  'filing',
  '备案信息',
  '{
    "icp": {
      "number": "京ICP备XXXXXXXX号",
      "url": "https://beian.miit.gov.cn"
    },
    "police": {
      "number": "京公网安备XXXXXXXXXXXXX号",
      "url": "http://www.beian.gov.cn"
    }
  }'::jsonb,
  7,
  true
),
(
  'disclaimer',
  '免责声明',
  '{
    "text": "本平台所展示的监管案例和资讯均来源于各级监管部门官方网站，仅供参考学习使用。如有疑问或需要了解详细信息，请访问相关监管部门官方网站或联系相关部门。本平台不对信息的准确性、完整性、及时性承担任何法律责任。"
  }'::jsonb,
  8,
  true
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_footer_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_footer_settings_updated_at
BEFORE UPDATE ON footer_settings
FOR EACH ROW
EXECUTE FUNCTION update_footer_settings_updated_at();

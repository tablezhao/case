/*
# 创建导航模块排序配置表

## 1. 新建表
- `navigation_order`
  - `id` (uuid, 主键)
  - `module_key` (text, 模块标识, 唯一)
  - `module_name` (text, 模块名称)
  - `route_path` (text, 路由路径)
  - `sort_order` (integer, 排序序号)
  - `is_visible` (boolean, 是否可见, 默认true)
  - `created_at` (timestamptz, 创建时间)
  - `updated_at` (timestamptz, 更新时间)

## 2. 功能说明
- 存储前端导航栏模块的排序配置
- 管理员可以通过管理后台调整模块的显示顺序
- 支持模块的显示/隐藏控制

## 3. 安全策略
- 所有用户可读取导航配置
- 仅管理员可修改导航配置

## 4. 初始数据
- 插入默认的导航模块配置
- 按照当前的显示顺序初始化
*/

-- 创建导航排序配置表
CREATE TABLE IF NOT EXISTS navigation_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text UNIQUE NOT NULL,
  module_name text NOT NULL,
  route_path text NOT NULL,
  sort_order integer NOT NULL,
  is_visible boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_navigation_order_sort ON navigation_order(sort_order);
CREATE INDEX IF NOT EXISTS idx_navigation_order_visible ON navigation_order(is_visible);

-- 启用RLS
ALTER TABLE navigation_order ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取导航配置
CREATE POLICY "Anyone can view navigation order" ON navigation_order
  FOR SELECT USING (true);

-- 仅管理员可以修改导航配置
CREATE POLICY "Admins can manage navigation order" ON navigation_order
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 插入默认导航模块配置
INSERT INTO navigation_order (module_key, module_name, route_path, sort_order, is_visible) VALUES
  ('home', '首页', '/', 1, true),
  ('cases', '案例查询', '/cases', 2, true),
  ('news', '监管资讯', '/news', 3, true),
  ('departments', '监管部门', '/departments', 4, true),
  ('trends', '趋势分析', '/trend-analysis', 5, true),
  ('issues', '问题分析', '/violation-analysis', 6, true)
ON CONFLICT (module_key) DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_navigation_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_navigation_order_updated_at ON navigation_order;
CREATE TRIGGER trigger_update_navigation_order_updated_at
  BEFORE UPDATE ON navigation_order
  FOR EACH ROW
  EXECUTE FUNCTION update_navigation_order_updated_at();

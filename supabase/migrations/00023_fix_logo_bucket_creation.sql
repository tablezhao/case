/*
# 修复Logo存储桶创建问题

## 问题描述
Migration 00014中通过SQL直接插入storage.buckets表的方式创建存储桶，
但在某些Supabase实例中这种方式不起作用，导致Logo存储桶未被创建。

## 解决方案
1. 检查并确保storage.buckets表中有Logo存储桶记录
2. 如果不存在，尝试重新插入
3. 确保存储桶的访问策略正确设置

## 存储桶配置
- 桶名：app-800go8thhcsh_logos
- 公开访问：是
- 文件大小限制：2MB (2097152字节)
- 允许的MIME类型：image/png, image/jpeg, image/svg+xml

## 访问策略
- 所有人可读
- 仅管理员可上传、更新、删除
*/

-- 1. 确保存储桶存在
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-800go8thhcsh_logos',
  'app-800go8thhcsh_logos',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 删除旧的存储策略（如果存在）
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete logos" ON storage.objects;

-- 3. 重新创建存储策略

-- 所有人可读
CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-800go8thhcsh_logos');

-- 仅管理员可上传
CREATE POLICY "Only admins can upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'app-800go8thhcsh_logos' 
    AND is_admin(auth.uid())
  );

-- 仅管理员可更新
CREATE POLICY "Only admins can update logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'app-800go8thhcsh_logos' 
    AND is_admin(auth.uid())
  );

-- 仅管理员可删除
CREATE POLICY "Only admins can delete logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'app-800go8thhcsh_logos' 
    AND is_admin(auth.uid())
  );

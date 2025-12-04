/*
# 创建临时文件上传存储桶

## 用途
用于智能案例导入功能中临时存储用户上传的图片和PDF文件

## 存储桶配置
- 名称: temp-uploads
- 公开访问: false（需要认证）
- 文件大小限制: 通过RLS策略控制

## 安全策略
1. 仅管理员可上传文件
2. 仅管理员可读取文件
3. 仅管理员可删除文件
4. 文件自动过期（可通过定时任务清理）
*/

-- 创建临时文件存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-uploads',
  'temp-uploads',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

-- 管理员可上传临时文件
CREATE POLICY "管理员可上传临时文件"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'temp-uploads' AND
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'::user_role)
);

-- 管理员可读取临时文件
CREATE POLICY "管理员可读取临时文件"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'temp-uploads' AND
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'::user_role)
);

-- 管理员可删除临时文件
CREATE POLICY "管理员可删除临时文件"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'temp-uploads' AND
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'::user_role)
);

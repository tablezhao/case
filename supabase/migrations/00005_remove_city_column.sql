/*
# 删除监管部门表的city字段

## 变更说明
删除regulatory_departments表中已废弃的city字段，简化数据结构。

## 变更内容
1. 删除city列
   - 该字段已不再使用
   - 部门定位通过level和province字段即可满足需求

## 影响范围
- 不影响现有功能
- 前端已移除city字段的输入和显示
- 类型定义已同步更新

## 执行时间
2025-12-04
*/

-- 删除city列
ALTER TABLE regulatory_departments DROP COLUMN IF EXISTS city;

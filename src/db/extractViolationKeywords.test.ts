
import { describe, it, expect } from 'vitest';
import { extractViolationKeywords } from './api';
import { normalizeKeyword, validateKeyword } from './compliance_rules';

describe('Violation Keywords Extraction & Compliance', () => {
  
  describe('Smart Completion (Rule-based)', () => {
    it('should normalize "超范围收集" to "超范围收集个人信息"', () => {
      const result = extractViolationKeywords('存在超范围收集行为');
      // 正则可能匹配到 "超范围收集"，然后 normalizeKeyword 将其补全
      expect(result).toContain('超范围收集个人信息');
    });

    it('should normalize "未经同意收集" to "未经用户同意收集个人信息"', () => {
      const result = extractViolationKeywords('未经同意收集用户ID');
      // 验证完整描述保持原样（或被正确提取）
      expect(result.some(k => k.includes('未经同意收集用户ID') || k.includes('未经用户同意收集'))).toBe(true);
      
      // 让我们看看实际行为：
      // 正则: /未(经|经过|经用户)同意.*?(收集|使用|处理|共享|提供|上传)(.*?(个人信息|用户信息|隐私信息|ID|设备信息|通讯录|位置|照片))?/g
      // 输入 "未经同意收集用户ID" -> 匹配 "未经同意收集用户ID" (完整)
      // 输入 "未经同意收集" -> 匹配 "未经同意收集" (不完整) -> 补全为 "未经用户同意收集个人信息"
      
      const result1 = extractViolationKeywords('未经同意收集');
      expect(result1).toContain('未经用户同意收集个人信息');
    });

    it('should normalize keyword directly', () => {
      expect(normalizeKeyword('超范围收集')).toBe('超范围收集个人信息');
      expect(normalizeKeyword('强制授权')).toBe('强制用户授权非必要权限');
    });

    it('should normalize "强制授权" to "强制用户授权非必要权限"', () => {
      const result = extractViolationKeywords('APP强制授权');
      expect(result).toContain('强制用户授权非必要权限');
    });
  });

  describe('Validation Logic', () => {
    it('should validate complete descriptions', () => {
      expect(validateKeyword('未经用户同意收集个人信息')).toBe(true);
      expect(validateKeyword('强制索取非必要权限')).toBe(true);
    });

    it('should reject incomplete descriptions', () => {
      // 长度不够
      expect(validateKeyword('收集')).toBe(false);
      // 缺少对象
      expect(validateKeyword('违规收集')).toBe(false); 
      // 缺少行为
      expect(validateKeyword('个人信息')).toBe(false);
    });
  });

  describe('Integration Test', () => {
    it('should extract, normalize and return compliant keywords', () => {
      const text = '超范围收集；强制授权；未明示收集规则';
      const result = extractViolationKeywords(text);
      
      expect(result).toEqual(expect.arrayContaining([
        '超范围收集个人信息',
        '强制用户授权非必要权限',
        '未明示收集使用个人信息的规则'
      ]));
    });

    it('should handle fallback for unknown but seemingly valid sentences', () => {
      const text = '这是一个未知的违规问题描述';
      const result = extractViolationKeywords(text);
      expect(result).toContain('这是一个未知的违规问题描述');
    });
  });
});

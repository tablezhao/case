/**
 * 语义拆分功能测试脚本
 * 
 * 用途：验证违规问题文本的拆分逻辑
 * 运行：node test-semantic-split.js
 */

// 模拟数据库的拆分逻辑
function splitViolationText(text) {
  if (!text || text.trim() === '') {
    return [];
  }

  // 按中文分号拆分
  const parts = text.split('；');
  
  // 清理空白字符并过滤空字符串
  return parts
    .map(part => part.trim())
    .filter(part => part.length > 0);
}

// 测试用例
const testCases = [
  {
    name: '测试1：基础拆分',
    input: '超范围收集个人信息；SDK信息公示不到位',
    expected: ['超范围收集个人信息', 'SDK信息公示不到位']
  },
  {
    name: '测试2：保留内部标点',
    input: '违规收集个人信息；APP强制、频繁、过度索取权限',
    expected: ['违规收集个人信息', 'APP强制、频繁、过度索取权限']
  },
  {
    name: '测试3：多项拆分',
    input: '欺骗误导用户下载APP；应用分发平台管理责任落实不到位；超范围收集个人信息',
    expected: ['欺骗误导用户下载APP', '应用分发平台管理责任落实不到位', '超范围收集个人信息']
  },
  {
    name: '测试4：单项不拆分',
    input: '违规收集个人信息',
    expected: ['违规收集个人信息']
  },
  {
    name: '测试5：带空格的拆分',
    input: '超范围收集个人信息 ； SDK信息公示不到位',
    expected: ['超范围收集个人信息', 'SDK信息公示不到位']
  },
  {
    name: '测试6：空字符串',
    input: '',
    expected: []
  },
  {
    name: '测试7：只有分号',
    input: '；；',
    expected: []
  },
  {
    name: '测试8：末尾有分号',
    input: '超范围收集个人信息；SDK信息公示不到位；',
    expected: ['超范围收集个人信息', 'SDK信息公示不到位']
  }
];

// 运行测试
console.log('🧪 开始测试语义拆分功能\n');
console.log('='.repeat(80));

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 ${testCase.name}`);
  console.log(`输入: "${testCase.input}"`);
  
  const result = splitViolationText(testCase.input);
  const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
  
  if (passed) {
    console.log('✅ 测试通过');
    passedTests++;
  } else {
    console.log('❌ 测试失败');
    console.log(`期望: ${JSON.stringify(testCase.expected)}`);
    console.log(`实际: ${JSON.stringify(result)}`);
    failedTests++;
  }
  
  console.log(`输出 (${result.length}项):`);
  result.forEach((item, i) => {
    console.log(`  ${i + 1}. "${item}" (${item.length}字符)`);
  });
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 测试结果汇总:`);
console.log(`   总计: ${testCases.length} 个测试`);
console.log(`   ✅ 通过: ${passedTests} 个`);
console.log(`   ❌ 失败: ${failedTests} 个`);
console.log(`   成功率: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 所有测试通过！语义拆分功能正常工作。');
} else {
  console.log('\n⚠️  部分测试失败，请检查拆分逻辑。');
}

console.log('\n' + '='.repeat(80));

// 模拟统计功能
console.log('\n📈 模拟高频问题统计\n');

const mockCases = [
  '超范围收集个人信息；SDK信息公示不到位',
  '违规收集个人信息；APP强制、频繁、过度索取权限',
  '超范围收集个人信息',
  'SDK信息公示不到位；违规收集个人信息',
  'APP强制、频繁、过度索取权限',
  '超范围收集个人信息；违规收集个人信息',
];

console.log('原始案例数据:');
mockCases.forEach((c, i) => {
  console.log(`  ${i + 1}. ${c}`);
});

// 拆分并统计
const allIssues = mockCases.flatMap(c => splitViolationText(c));
const issueFrequency = {};

allIssues.forEach(issue => {
  issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
});

// 排序
const sortedIssues = Object.entries(issueFrequency)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

const totalCount = allIssues.length;

console.log('\n拆分后的高频问题统计 (TOP 10):');
console.log('-'.repeat(80));
console.log('排名 | 违规问题                                    | 频次 | 占比');
console.log('-'.repeat(80));

sortedIssues.forEach(([issue, freq], index) => {
  const percentage = ((freq / totalCount) * 100).toFixed(2);
  const truncatedIssue = issue.length > 40 ? issue.substring(0, 37) + '...' : issue;
  console.log(`${(index + 1).toString().padStart(4)} | ${truncatedIssue.padEnd(43)} | ${freq.toString().padStart(4)} | ${percentage.padStart(5)}%`);
});

console.log('-'.repeat(80));
console.log(`总计: ${allIssues.length} 个问题实例，${Object.keys(issueFrequency).length} 个独立问题\n`);

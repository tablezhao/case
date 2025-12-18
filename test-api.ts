import { getNationalDepartmentDistribution, getProvincialDepartmentDistribution } from './src/db/api';

async function testApi() {
  try {
    console.log('Testing getNationalDepartmentDistribution...');
    const nationalDeptData = await getNationalDepartmentDistribution();
    console.log('国家级部门数据:', nationalDeptData);
    console.log('国家级部门数量:', nationalDeptData.length);
    
    console.log('\nTesting getProvincialDepartmentDistribution...');
    const provincialDeptData = await getProvincialDepartmentDistribution();
    console.log('省级部门数据:', provincialDeptData);
    console.log('省级部门数量:', provincialDeptData.length);
    
    // 检查是否包含缺少的部门
    console.log('\n检查是否包含缺少的部门:');
    const missingNationalDepts = [
      '公安部计算机信息系统安全产品质量监督检验中心',
      '工业和信息化部'
    ];
    
    missingNationalDepts.forEach(dept => {
      const found = nationalDeptData.some(item => item.name === dept);
      console.log(`${dept}: ${found ? '✅ 找到' : '❌ 未找到'}`);
    });
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testApi();
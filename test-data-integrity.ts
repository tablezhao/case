import { supabase } from './src/db/supabase.ts';
import { getNationalDepartmentDistribution, getProvincialDepartmentDistribution } from './src/db/api.ts';

async function testDataIntegrity() {
  console.log('=== 数据完整性测试开始 ===\n');

  try {
    // 1. 检查所有案例数据
    console.log('1. 检查所有案例数据...');
    const { data: allCases, error: casesError } = await supabase
      .from('cases')
      .select('id, department_id');
    
    if (casesError) {
      console.error('❌ 获取案例数据失败:', casesError);
      return;
    }
    
    console.log(`   总案例数: ${allCases?.length || 0}`);
    
    // 检查没有关联部门的案例
    const casesWithoutDept = (allCases || []).filter(c => !c.department_id);
    console.log(`   没有关联部门的案例数: ${casesWithoutDept.length}`);
    if (casesWithoutDept.length > 0) {
      console.log('   部分案例缺少部门关联，可能影响统计结果');
    }

    // 2. 检查所有部门数据
    console.log('\n2. 检查所有部门数据...');
    const { data: allDepartments, error: deptError } = await supabase
      .from('regulatory_departments')
      .select('id, name, level, province');
    
    if (deptError) {
      console.error('❌ 获取部门数据失败:', deptError);
      return;
    }
    
    console.log(`   总部门数: ${allDepartments?.length || 0}`);
    
    const nationalDepts = (allDepartments || []).filter(d => d.level === 'national');
    const provincialDepts = (allDepartments || []).filter(d => d.level === 'provincial');
    
    console.log(`   国家级部门数: ${nationalDepts.length}`);
    console.log(`   省级部门数: ${provincialDepts.length}`);

    // 3. 测试API函数返回结果
    console.log('\n3. 测试国家级部门分布API...');
    const nationalDeptDist = await getNationalDepartmentDistribution();
    console.log(`   API返回部门数: ${nationalDeptDist.length}`);
    console.log('   国家级部门分布结果:');
    nationalDeptDist.forEach(dept => {
      console.log(`   - ${dept.name}: ${dept.count}`);
    });

    console.log('\n4. 测试省级部门分布API...');
    const provincialDeptDist = await getProvincialDepartmentDistribution();
    console.log(`   API返回部门数: ${provincialDeptDist.length}`);
    console.log('   前10个省级部门分布结果:');
    provincialDeptDist.slice(0, 10).forEach(dept => {
      console.log(`   - ${dept.name}: ${dept.count}`);
    });

    // 4. 验证部门全覆盖
    console.log('\n5. 验证部门全覆盖...');
    const nationalDeptNamesFromAPI = new Set(nationalDeptDist.map(d => d.name));
    const nationalDeptNamesFromDB = new Set(nationalDepts.map(d => d.name));
    
    const missingNationalDepts = [...nationalDeptNamesFromDB].filter(name => !nationalDeptNamesFromAPI.has(name));
    if (missingNationalDepts.length > 0) {
      console.log(`   ❌ 以下国家级部门在API结果中缺失:`);
      missingNationalDepts.forEach(name => console.log(`   - ${name}`));
    } else {
      console.log('   ✅ 所有国家级部门都在API结果中');
    }

    // 5. 统计各部门案例数量分布
    console.log('\n6. 统计案例数量分布...');
    const countDistribution: Record<number, number> = {};
    nationalDeptDist.forEach(dept => {
      countDistribution[dept.count] = (countDistribution[dept.count] || 0) + 1;
    });
    
    console.log('   案例数量分布:');
    Object.entries(countDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([count, deptCount]) => {
        console.log(`   - 案例数 ${count}: ${deptCount} 个部门`);
      });

    console.log('\n=== 数据完整性测试结束 ===');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

testDataIntegrity();

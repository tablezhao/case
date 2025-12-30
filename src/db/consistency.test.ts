import { describe, it, expect } from 'vitest';
import { getStatsOverviewOptimized, clearAllCache } from './api-optimized';
import { getTrendOverview } from './api';

describe('Data Consistency Checks', () => {
  it('should have consistent current month case counts between Homepage and Trend Page', async () => {
    // Clear cache to ensure fresh data
    clearAllCache();

    // Fetch data from both sources
    const [homeStats, trendStats] = await Promise.all([
      getStatsOverviewOptimized(),
      getTrendOverview()
    ]);

    // Log for debugging
    console.log('Home Stats (Current Month):', homeStats.current_month_cases);
    console.log('Trend Stats (Current Month):', trendStats.currentMonthRisk.count);

    // Assert consistency
    expect(Number(homeStats.current_month_cases)).toBe(Number(trendStats.currentMonthRisk.count));
  });
});

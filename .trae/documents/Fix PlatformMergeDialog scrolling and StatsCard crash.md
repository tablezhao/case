I have identified the cause of the `TypeError: Cannot read properties of null (reading 'toFixed')` error.

### Problem Analysis

The error occurs in `src/components/home/StatsCard.tsx`.

* The code attempts to call `.toFixed(1)` on the `changePercent` prop.

* The current check `changePercent !== undefined` allows `null` values to pass through.

* When `changePercent` is `null` (which can happen if the API returns null for a statistic), accessing `null.toFixed(1)` throws the reported TypeError.

* The stack trace mentions `StatsCard2`, which is likely a runtime name for the memoized `StatsCard` component, and the line number discrepancy (166 vs 125) suggests a potential version mismatch or build artifact, but the logic error is clearly present in the source code I analyzed.

### Proposed Fix

I will modify `src/components/home/StatsCard.tsx` to strictly handle `null` values in addition to `undefined`.

1. **Update Trend Rendering Condition**:
   Change the condition guarding the trend section to explicitly exclude `null`.

   ```typescript
   // Before
   showTrend && change !== undefined && changePercent !== undefined && (

   // After
   showTrend && change != null && changePercent != null && (
   ```

2. **Update Helper Functions**:
   Update `getTrendColor`, `getTrendBadgeVariant`, and `getTrendIcon` to handle `null` values for `change` gracefully, preventing potential logical errors (e.g., treating `null` as "decrease" or valid number).
   Change `change === undefined` to `change == null` (which checks for both null and undefined).

### Verification

* I will verify the changes by reading the file again to ensure the logic is correct.

* This fix addresses the root cause (null pointer exception) directly.


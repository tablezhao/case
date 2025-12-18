// Vitest setup file
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 每次测试后清理DOM
afterEach(() => {
  cleanup();
});

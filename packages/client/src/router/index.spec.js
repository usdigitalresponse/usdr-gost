import { describe, it, expect } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

import { routes } from '@/router';

describe('Router logic', () => {
  it('displays 404 page for unknown route', async () => {
    const router = createRouter({ routes, history: createWebHistory() });
    await router.push('/rants');
    expect(router.currentRoute.value.name).toBe('notFound');
  });

  it('redirects hash URLs to non-hash URLS', async () => {
    const router = createRouter({ routes, history: createWebHistory() });
    await router.push('/#/login');
    expect(router.currentRoute.value.fullPath).toBe('/login');
    expect(router.currentRoute.value.name).toBe('login');
  });
});

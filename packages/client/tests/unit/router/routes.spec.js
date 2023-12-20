import { expect } from 'chai';
import VueRouter from 'vue-router';
import { createLocalVue } from '@vue/test-utils';

import { routes } from '@/router';

const localVue = createLocalVue();
localVue.use(VueRouter);

describe('Router logic', () => {
  it('displays 404 page for unknown route', async () => {
    const router = new VueRouter({ routes, mode: 'history' });
    await router.push('/rants');
    expect(router.currentRoute.name).to.equal('notFound');
  });

  it('redirects hash URLs to non-hash URLS', async () => {
    const router = new VueRouter({ routes, mode: 'history' });
    await router.push('/#/grants');
    expect(router.currentRoute.fullPath).to.equal('/grants');
    expect(router.currentRoute.name).to.equal('grants');
  });
});

import {
  describe, beforeEach, it, expect,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import PageNavigation from '@/arpa_reporter/components/PageNavigation.vue';

describe('PageNavigation.vue', () => {
  let store;
  let $route;
  beforeEach(() => {
    store = createStore({
      getters: {
        periodNames: () => ['September, 2020', 'December, 2020'],
        viewPeriod: () => ({ id: 1 }),
        user: () => ({ email: 'user@example.com', role: 'admin' }),
        applicationTitle: () => 'ARPA Reporter',
        agencyName: () => (id) => `Agency ${id}`,
      },
    });
    $route = { path: '/' };
  });

  it('renders the nav element', () => {
    const wrapper = shallowMount(PageNavigation, {
      global: {
        plugins: [store],
        stubs: ['router-link', 'router-view'],
        mocks: { $route },
      },
    });
    const navbars = wrapper.findAll('nav.navbar');
    expect(navbars.length).toBe(1); // has one navbar element

    const navs = wrapper.findAll('ul.nav');
    expect(navs.length).toBe(1); // has one nav element
  });

  it('include title', () => {
    const wrapper = shallowMount(PageNavigation, {
      global: {
        plugins: [store],
        stubs: ['router-link', 'router-view'],
        mocks: { $route },
      },
    });
    const r = wrapper.find('a.navbar-brand');
    expect(r.text()).toContain('ARPA Reporter');
  });
});

// NOTE: This file was copied from tests/unit/components/Navigation.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z

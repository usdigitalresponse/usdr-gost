import { expect } from 'chai';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import PageNavigation from '@/arpa_reporter/components/PageNavigation.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('PageNavigation.vue', () => {
  let store;
  let $route;
  beforeEach(() => {
    store = new Vuex.Store({
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
      store,
      localVue,
      stubs: ['router-link', 'router-view'],
      mocks: { $route },
    });
    const navbars = wrapper.findAll('nav.navbar');
    expect(navbars.length).toBe(1);

    const navs = wrapper.findAll('ul.nav');
    expect(navs.length).toBe(1);
  });

  it('include title', () => {
    const wrapper = shallowMount(PageNavigation, {
      store,
      localVue,
      stubs: ['router-link', 'router-view'],
      mocks: { $route },
    });
    const r = wrapper.find('a.navbar-brand');
    expect(r.text()).to.include('ARPA Reporter');
  });
});

// NOTE: This file was copied from tests/unit/components/Navigation.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z

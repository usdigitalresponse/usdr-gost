import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
// import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { render } from 'vitest-browser-vue';
import { createRouter, createWebHistory } from 'vue-router';
import AgenciesView from '@/arpa_reporter/views/AgenciesView.vue';

describe('AgenciesView', () => {
  const mockAgencies = [
    { id: 1, code: 'AG1', name: 'Agency One' },
    { id: 2, code: 'AG2', name: 'Agency Two' },
  ];

  const store = createStore({
    state: {
      agencies: mockAgencies,
    },
    actions: {
      updateAgencies: vi.fn(),
    },
  });

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/agencies/new', name: 'new-agency' },
      { path: '/agencies/:id', name: 'edit-agency' },
    ],
  });

  let screen;

  beforeEach(() => {
    screen = render(AgenciesView, {
      global: {
        plugins: [store, router],
      },
    });
  });

  it('renders the agencies table with correct headings', () => {
    expect(screen.getByRole('heading', { name: /agencies/i, level: 1 }).element()).toBeInTheDocument();
  });

  it('displays agency data correctly', () => {
    mockAgencies.forEach((agency) => {
      expect(screen.getByText(agency.code).element()).toBeInTheDocument();
      expect(screen.getByText(agency.name).element()).toBeInTheDocument();
    });
  });

  it('has a create new agency button', () => {
    expect(screen.getByRole('link', { name: /create new agency/i }).element()).toBeInTheDocument();
  });
});

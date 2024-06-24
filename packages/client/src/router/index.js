import VueRouter from 'vue-router';

import BaseLayout from '@/components/BaseLayout.vue';
import { shareTerminologyEnabled, newTerminologyEnabled, newGrantsDetailPageEnabled } from '@/helpers/featureFlags';
import LoginView from '@/views/LoginView.vue';

import store from '@/store';

const myGrantsTabs = [
  shareTerminologyEnabled() ? 'shared-with-your-team' : 'assigned',
  'interested',
  'not-applying',
  'applied',
];

export const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/arpa-annual-performance-reporter',
    name: 'annualReporter',
    component: () => import('@/views/ArpaAnnualPerformanceReporterView.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    // This is required in dev (and is harmless in production) to ensure `/arpa_reporter` loads the
    // ARPA SPA rather than the Grants SPA (see https://github.com/vitejs/vite/issues/2958#issuecomment-1146492483 for some context)
    path: '/arpa_reporter',
    redirect: () => { window.location.href = '/arpa_reporter/'; },
  },
  {
    path: '/',
    name: 'layout',
    redirect: (to) => {
      if (to.fullPath.startsWith('/#/')) {
        // Redirect any old hash-style URLs to the new history API URL.
        return { path: to.hash.substring(1), hash: '' };
      }
      return { name: 'grants' };
    },
    component: BaseLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/RecentActivity',
        name: 'RecentActivity',
        component: () => import('@/views/RecentActivityView.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/UpcomingClosingDates',
        name: 'UpcomingClosingDates',
        component: () => import('@/views/UpcomingClosingDatesView.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/grants',
        name: 'grants',
        component: () => import('../views/GrantsView.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/grants/:id',
        name: 'grantDetail',
        component: () => import('@/views/GrantDetailsView.vue'),
        meta: {
          hideLayoutTabs: true,
          requiresAuth: true,
          requiresNewGrantsDetailPageEnabled: true,
        },
      },
      {
        path: '/my-grants',
        redirect: { name: 'myGrants', params: { tab: myGrantsTabs[0] } },
      },
      {
        path: '/my-grants/assigned',
        name: 'assigned',
        redirect: { name: shareTerminologyEnabled ? 'shared-with-your-team' : undefined },
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/my-grants/shared-with-your-team',
        name: 'shared-with-your-team',
        component: () => import('@/views/MyGrantsView.vue'),
        meta: {
          requiresAuth: true,
          requiresShareTerminologyEnabled: true,
        },
      },
      {
        path: '/my-grants/:tab',
        name: 'myGrants',
        component: () => import('../views/MyGrantsView.vue'),
        meta: {
          tabNames: myGrantsTabs,
          requiresAuth: true,
        },
        beforeEnter: (to, _, next) => {
          if (to.meta.tabNames.includes(to.params.tab)) {
            next();
          } else {
            next('/404');
          }
        },
      },
      {
        path: '/tenants',
        name: 'tenants',
        redirect: newTerminologyEnabled() ? '/organizations' : undefined,
        component: () => import('@/views/OrganizationsView.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/organizations',
        name: 'organizations',
        component: () => import('@/views/OrganizationsView.vue'),
        meta: {
          requiresAuth: true,
          requiresNewTerminologyEnabled: true,
        },
      },
      {
        path: '/users',
        name: 'users',
        component: () => import('@/views/UsersView.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/agencies',
        name: 'agencies',
        redirect: newTerminologyEnabled() ? '/teams' : undefined,
        component: () => import('@/views/TeamsView.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/teams',
        name: 'teams',
        component: () => import('@/views/TeamsView.vue'),
        meta: {
          requiresAuth: true,
          requiresNewTerminologyEnabled: true,
        },
      },
      {
        path: '/my-profile',
        name: 'myProfile',
        component: () => import('../views/MyProfileView.vue'),
        meta: {
          requiresAuth: true,
          hideLayoutTabs: true,
        },
      },
    ],
  },
  {
    path: '*',
    component: () => import('../views/NotFoundView.vue'),
    name: 'notFound',
    meta: {
      requiresAuth: true,
    },
  },
];

const router = new VueRouter({
  base: import.meta.env.BASE_URL,
  mode: 'history',
  routes,
});

function loggedIn() {
  const loggedInUser = store.getters['users/loggedInUser'];
  return loggedInUser != null;
}

router.beforeEach((to, from, next) => {
  const authenticated = loggedIn();
  if (to.meta.requiresAuth && !authenticated) {
    // This will include any router base URL, if configured
    const redirectTo = router.resolve(to.fullPath).href;

    next({ name: 'login', query: { redirect_to: redirectTo } });
  } else if (to.name === 'login' && authenticated) {
    next({ name: 'grants' });
  } else if (
    (to.meta.requiresNewTerminologyEnabled && !newTerminologyEnabled())
    || (to.meta.requiresNewGrantsDetailPageEnabled && !newGrantsDetailPageEnabled())
    || (to.meta.requiresShareTerminologyEnabled && !shareTerminologyEnabled())
  ) {
    if (authenticated) {
      next({ name: 'grants' });
    } else {
      next({ name: 'login' });
    }
  } else {
    next();
  }
});

export default router;

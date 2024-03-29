import VueRouter from 'vue-router';

import { myProfileEnabled, newTerminologyEnabled, newGrantsDetailPageEnabled } from '@/helpers/featureFlags';
import LoginView from '@/views/LoginView.vue';
import BaseLayout from '@/components/BaseLayout.vue';
import ArpaAnnualPerformanceReporter from '../views/ArpaAnnualPerformanceReporter.vue';

import store from '../store';

export const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/arpa-annual-performance-reporter',
    name: 'annualReporter',
    component: ArpaAnnualPerformanceReporter,
    meta: {
      requiresAuth: true,
    },
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
        component: () => import('../views/Dashboard.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/RecentActivity',
        name: 'RecentActivity',
        component: () => import('../views/RecentActivity.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/UpcomingClosingDates',
        name: 'UpcomingClosingDates',
        component: () => import('../views/UpcomingClosingDates.vue'),
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
        redirect: '/my-grants/interested',
      },
      {
        path: '/my-grants/:tab',
        name: 'myGrants',
        component: () => import('../views/MyGrantsView.vue'),
        meta: {
          tabNames: ['interested', 'assigned', 'not-applying', 'applied'],
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
        component: () => import('../views/Users.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/agencies',
        name: 'agencies',
        redirect: newTerminologyEnabled() ? '/teams' : undefined,
        component: () => import('../views/Teams.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/teams',
        name: 'teams',
        component: () => import('../views/Teams.vue'),
        meta: {
          requiresAuth: true,
          requiresNewTerminologyEnabled: true,
        },
      },
      {
        path: '/my-profile',
        name: 'myProfile',
        component: () => import('../views/MyProfile.vue'),
        meta: {
          requiresAuth: true,
          requiresMyProfileEnabled: true,
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
  base: process.env.BASE_URL,
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
    (to.meta.requiresMyProfileEnabled && !myProfileEnabled())
    || (to.meta.requiresNewTerminologyEnabled && !newTerminologyEnabled())
    || (to.meta.requiresNewGrantsDetailPageEnabled && !newGrantsDetailPageEnabled())
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

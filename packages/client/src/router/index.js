import Vue from 'vue';
import VueRouter from 'vue-router';

import { myProfileEnabled, newTerminologyEnabled } from '@/helpers/featureFlags';
import Login from '../views/Login.vue';
import Layout from '../components/Layout.vue';
import ArpaAnnualPerformanceReporter from '../views/ArpaAnnualPerformanceReporter.vue';

import store from '../store';

Vue.use(VueRouter);

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
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
    redirect: '/my-grants',
    component: Layout,
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
        component: () => import('../views/Grants.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/my-grants',
        name: 'myGrants',
        component: () => import('../views/MyGrants.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/tenants',
        name: 'tenants',
        redirect: newTerminologyEnabled() ? '/organizations' : undefined,
        component: () => import('../views/Organizations.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/organizations',
        name: 'organizations',
        component: () => import('../views/Organizations.vue'),
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
    redirect: '/my-grants',
  },
];

const router = new VueRouter({
  base: process.env.BASE_URL,
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
  } else if (to.name === 'not-found'
    || (to.meta.requiresMyProfileEnabled && !myProfileEnabled())
    || (to.meta.requiresNewTerminologyEnabled && !newTerminologyEnabled())
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

import Vue from 'vue';
import VueRouter from 'vue-router';

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
    redirect: '/dashboard',
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
        path: '/eligibility-codes',
        name: 'eligibilityCodes',
        component: () => import('../views/EligibilityCodes.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/keywords',
        name: 'keywords',
        component: () => import('../views/Keywords.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/tenants',
        name: 'tenants',
        component: () => import('../views/Tenants.vue'),
        meta: {
          requiresAuth: true,
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
        component: () => import('../views/Agencies.vue'),
        meta: {
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '*',
    redirect: '/dashboard',
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

// Set to ensure redirect logic is valid in the router.beforeEach below
const routeNameSet = new Set();
routes.forEach((route) => {
  // wildcard route does not have a name
  if (route.name) {
    routeNameSet.add(route.name);
  }

  // If children ever goes deeper than one level this needs work
  if (route.children) {
    route.children.forEach((childRoute) => {
      if (childRoute.name) {
        routeNameSet.add(childRoute.name);
      }
    });
  }
});

router.beforeEach((to, from, next) => {
  const authenticated = loggedIn();
  if (to.meta.requiresAuth && !authenticated) {
    next({ name: 'login', query: { redirect_to: to.name } });
  } else if (authenticated && to.query.redirect_to) {
    // Prevent them from accessing an undefined route, causes ugly blank screen failure
    if (routeNameSet.has(to.query.redirect_to)) {
      next({ name: to.query.redirect_to });
    } else {
      next({ name: 'grants' });
    }
  } else if (to.name === 'login' && authenticated) {
    next({ name: 'grants' });
  } else if (to.name === 'not-found') {
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

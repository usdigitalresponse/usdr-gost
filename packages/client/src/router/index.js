import Vue from 'vue';
import VueRouter from 'vue-router';

import Login from '../views/Login.vue';

import store from '../store';

Vue.use(VueRouter);

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/grants',
    name: 'Grants',
    component: () => import('../views/Grants.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/eligibility-codes',
    name: 'EligibilityCodes',
    component: () => import('../views/EligibilityCodes.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/keywords',
    name: 'Keywords',
    component: () => import('../views/Keywords.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/Users.vue'),
    meta: {
      requiresAuth: true,
    },
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
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!loggedIn()) {
      next({
        path: '/login',
      });
    } else {
      next();
    }
  } else {
    next(); // make sure to always call next()!
  }
});

export default router;

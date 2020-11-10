import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/grants',
    name: 'Grants',
    component: () => import('../views/Grants.vue'),
  },
  {
    path: '/eligibility-codes',
    name: 'EligibilityCodes',
    component: () => import('../views/EligibilityCodes.vue'),
  },
  {
    path: '/keywords',
    name: 'Keywords',
    component: () => import('../views/Keywords.vue'),
  },
];

const router = new VueRouter({
  base: process.env.BASE_URL,
  routes,
});

export default router;

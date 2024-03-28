import Vue from 'vue';
import VueRouter from 'vue-router';

import AgenciesView from '@/arpa_reporter/views/AgenciesView.vue';
import AgencyView from '@/arpa_reporter/views/AgencyView.vue';
import HomeView from '@/arpa_reporter/views/HomeView.vue';
import LoginView from '@/arpa_reporter/views/LoginView.vue';
import ValidationView from '@/arpa_reporter/views/ValidationView.vue';
import NewTemplate from '../views/NewTemplate.vue';
import NewUpload from '../views/NewUpload.vue';
import Upload from '../views/Upload.vue';
import Uploads from '../views/Uploads.vue';
import ReportingPeriod from '../views/ReportingPeriod.vue';
import ReportingPeriods from '../views/ReportingPeriods.vue';
import Subrecipient from '../views/Subrecipient.vue';
import Subrecipients from '../views/Subrecipients.vue';
import User from '../views/User.vue';
import Users from '../views/Users.vue';
import store from '../store/index';

Vue.use(VueRouter);

const routes = [
  { path: '/login', name: 'Login', component: LoginView },
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresLogin: true },
  },
  {
    path: '/new_upload',
    name: 'NewUpload',
    component: NewUpload,
    meta: { requiresLogin: true },
  },
  {
    path: '/new_template/:id',
    name: 'NewTemplate',
    component: NewTemplate,
    meta: { requiresLogin: true },
  },
  {
    path: '/uploads',
    name: 'Uploads',
    component: Uploads,
    meta: { requiresLogin: true },
  },
  {
    path: '/uploads/:id',
    name: 'Upload',
    component: Upload,
    meta: { requiresLogin: true },
  },
  {
    path: '/agencies',
    name: 'Agencies',
    component: AgenciesView,
    meta: { requiresLogin: true },
  },
  {
    path: '/agencies/:id',
    name: 'Agency',
    component: AgencyView,
    meta: { requiresLogin: true },
  },
  {
    path: '/reporting_periods',
    name: 'ReportingPeriods',
    component: ReportingPeriods,
    meta: { requiresLogin: true },
  },
  {
    path: '/reporting_periods/:id',
    name: 'ReportingPeriod',
    component: ReportingPeriod,
    meta: { requiresLogin: true },
  },
  {
    path: '/subrecipients',
    name: 'Subrecipients',
    component: Subrecipients,
    meta: { requiresLogin: true },
  },
  {
    path: '/subrecipients/:id',
    name: 'Subrecipient',
    component: Subrecipient,
    meta: { requiresLogin: true },
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
    meta: { requiresLogin: true },
  },
  {
    path: '/users/:id',
    name: 'User',
    component: User,
    meta: { requiresLogin: true },
  },
  {
    path: '/validation',
    name: 'Validation',
    component: ValidationView,
    meta: { requiresLogin: true },
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.VUE_APP_IS_GOST
    ? `${process.env.BASE_URL}arpa_reporter/`
    : process.env.BASE_URL,
  routes,
});

function loggedIn() {
  return store.state.user != null;
}

router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresLogin)) {
    if (!loggedIn()) {
      // This will include any router base URL, if configured
      const redirectTo = router.resolve(to.fullPath).href;

      next({
        path: '/login',
        query: { redirect_to: redirectTo },
      });
    } else {
      next();
    }
  } else {
    next(); // make sure to always call next()!
  }
});

export default router;

// NOTE: This file was copied from src/router/index.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z

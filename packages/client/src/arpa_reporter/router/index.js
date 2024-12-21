import { createRouter, createWebHistory } from 'vue-router';

import AgenciesView from '@/arpa_reporter/views/AgenciesView.vue';
import AgencyView from '@/arpa_reporter/views/AgencyView.vue';
import HomeView from '@/arpa_reporter/views/HomeView.vue';
import LoginView from '@/arpa_reporter/views/LoginView.vue';
import NewTemplateView from '@/arpa_reporter/views/NewTemplateView.vue';
import NewUploadView from '@/arpa_reporter/views/NewUploadView.vue';
import ReportingPeriodView from '@/arpa_reporter/views/ReportingPeriodView.vue';
import ReportingPeriodsView from '@/arpa_reporter/views/ReportingPeriodsView.vue';
import SubrecipientView from '@/arpa_reporter/views/SubrecipientView.vue';
import SubrecipientsView from '@/arpa_reporter/views/SubrecipientsView.vue';
import UserView from '@/arpa_reporter/views/UserView.vue';
import UsersView from '@/arpa_reporter/views/UsersView.vue';
import UploadView from '@/arpa_reporter/views/UploadView.vue';
import UploadsView from '@/arpa_reporter/views/UploadsView.vue';
import store from '@/arpa_reporter/store';

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
    component: NewUploadView,
    meta: { requiresLogin: true },
  },
  {
    path: '/new_template/:id',
    name: 'NewTemplate',
    component: NewTemplateView,
    meta: { requiresLogin: true },
  },
  {
    path: '/uploads',
    name: 'Uploads',
    component: UploadsView,
    meta: { requiresLogin: true },
  },
  {
    path: '/uploads/:id',
    name: 'Upload',
    component: UploadView,
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
    component: ReportingPeriodsView,
    meta: { requiresLogin: true },
  },
  {
    path: '/reporting_periods/:id',
    name: 'ReportingPeriod',
    component: ReportingPeriodView,
    meta: { requiresLogin: true },
  },
  {
    path: '/subrecipients',
    name: 'Subrecipients',
    component: SubrecipientsView,
    meta: { requiresLogin: true },
  },
  {
    path: '/subrecipients/:id',
    name: 'Subrecipient',
    component: SubrecipientView,
    meta: { requiresLogin: true },
  },
  {
    path: '/users',
    name: 'Users',
    component: UsersView,
    meta: { requiresLogin: true },
  },
  {
    path: '/users/:id',
    name: 'User',
    component: UserView,
    meta: { requiresLogin: true },
  },
];

const router = createRouter({
  history: createWebHistory(`${import.meta.env.BASE_URL}arpa_reporter/`),
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

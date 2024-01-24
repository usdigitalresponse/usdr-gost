/* eslint-disable import/first */
import { datadogRum } from '@datadog/browser-rum';

if (window.APP_CONFIG?.DD_RUM_ENABLED === true) {
  datadogRum.init(window.APP_CONFIG.DD_RUM_CONFIG);
}

import Vue from 'vue';
import VueRouter from 'vue-router';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import vSelect from 'vue-select';
import Vuelidate from 'vuelidate';
import { setUserForGoogleAnalytics } from '@/helpers/gtag';
import App from './App.vue';
import router from './router';
import store from './store';
import './assets/fix-sticky-headers.css';
import './assets/adjust-vue-select.css';
import { data } from './mixin/resizableTable';

const fetchApi = require('@/helpers/fetchApi');

if (window.APP_CONFIG?.GOOGLE_TAG_ID) {
  store.watch((state) => state.users.loggedInUser, (newUser) => setUserForGoogleAnalytics(newUser));
}


store.watch((state) => state.users.loggedInUser, (newUser) => datadogRum.setUser({ id: newUser.id, 'agency.id': newUser.agency_id, 'role': newUser.role.name, 'organization.id': newUser.tenant_id }));

// Install BootstrapVue
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);
Vue.use(Vuelidate);
Vue.use(VueRouter);
Vue.component('v-select', vSelect);

Vue.config.productionTip = false;
Vue.prototype.$negative_keywords_enabled = process.env.VUE_APP_NEGATIVE_KEYWORDS_ENABLED === 'true';

fetchApi.get('/api/sessions')
  .then((data) => {
    if (data && data.user) {
      store.dispatch('users/login', data.user);
      store.dispatch('grants/fetchInterestedCodes');
    }
    new Vue({
      router,
      store,
      render: (h) => h(App),
    }).$mount('#app');
  })
  .catch((e) => {
    store.dispatch('users/logout');
    console.log(e);
  });

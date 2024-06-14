/* eslint-disable import/first */
import { datadogRum } from '@datadog/browser-rum';

if (window.APP_CONFIG?.DD_RUM_ENABLED === true) {
  datadogRum.init(window.APP_CONFIG.DD_RUM_CONFIG);
  datadogRum.setGlobalContextProperty('app', 'finder');
}

import { createApp } from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import { VueSelect } from 'vue-select';
import { setUserForGoogleAnalytics } from '@/helpers/gtag';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import * as fetchApi from '@/helpers/fetchApi';
import '@/assets/fix-sticky-headers.css';
import '@/assets/adjust-vue-select.css';

if (window.APP_CONFIG?.GOOGLE_TAG_ID) {
  store.watch((state) => state.users.loggedInUser, (newUser) => setUserForGoogleAnalytics(newUser));
}

store.watch((state) => state.users.loggedInUser, (newUser) => datadogRum.setUser({
  id: newUser.id, agency_id: newUser.agency_id, role: newUser.role.name, organization_id: newUser.tenant_id,
}));

const app = createApp(App);

app.use(router);
app.use(store);
app.use(BootstrapVue);
app.use(IconsPlugin);
app.component('VSelect', VueSelect);

fetchApi.get('/api/sessions')
  .then((data) => {
    if (data && data.user) {
      store.dispatch('users/login', data.user);
      store.dispatch('grants/fetchInterestedCodes');
    }
    app.mount('#app');
  })
  .catch((e) => {
    store.dispatch('users/logout');
    console.log(e);
  });

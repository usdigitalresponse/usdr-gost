/* eslint-disable import/first */
import { datadogRum } from '@datadog/browser-rum';

if (window.APP_CONFIG?.DD_RUM_ENABLED === true) {
  datadogRum.init(window.APP_CONFIG.DD_RUM_CONFIG);
  datadogRum.setGlobalContextProperty('app', 'finder');
}

import { createApp } from 'vue';
import { BootstrapVue } from 'bootstrap-vue';
import { BootstrapIcon } from '@dvuckovic/vue3-bootstrap-icons';
import { injectBootstrapIcons } from '@dvuckovic/vue3-bootstrap-icons/utils';
import BootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg?raw';
import { VueSelect } from 'vue-select';
import { setUserForGoogleAnalytics } from '@/helpers/gtag';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import * as fetchApi from '@/helpers/fetchApi';

import '@dvuckovic/vue3-bootstrap-icons/dist/style.css';
import '@/assets/fix-sticky-headers.css';
import '@/assets/adjust-vue-select.css';

if (window.APP_CONFIG?.GOOGLE_TAG_ID) {
  store.watch((state) => state.users.loggedInUser, (newUser) => setUserForGoogleAnalytics(newUser));
}

store.watch((state) => state.users.loggedInUser, (newUser) => datadogRum.setUser({
  id: newUser.id, agency_id: newUser.agency_id, role: newUser.role.name, organization_id: newUser.tenant_id,
}));

const app = createApp(App);

app.use(BootstrapVue);
injectBootstrapIcons(BootstrapIcons);
app.component('BIcon', BootstrapIcon);
app.component('VSelect', VueSelect);

fetchApi.get('/api/sessions')
  .then((data) => {
    if (data && data.user) {
      store.dispatch('users/login', data.user);
      store.dispatch('grants/fetchInterestedCodes');
    }
    // With the current session setup, we need router to initialize only after session info has been loaded into the store
    app.use(store);
    app.use(router);
    app.mount('#app');
  })
  .catch((e) => {
    store.dispatch('users/logout');
    console.log(e);
  });

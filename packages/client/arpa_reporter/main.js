/* eslint-disable import/first */
import { datadogRum } from '@datadog/browser-rum';

if (window.APP_CONFIG?.DD_RUM_ENABLED === true) {
  datadogRum.init(window.APP_CONFIG.DD_RUM_CONFIG);
  datadogRum.setGlobalContextProperty('app', 'arpa-reporter');
}

import { createApp } from 'vue';
import { BootstrapVue } from 'bootstrap-vue';
import { BootstrapIcon } from '@dvuckovic/vue3-bootstrap-icons';
import { injectBootstrapIcons } from '@dvuckovic/vue3-bootstrap-icons/utils';
import BootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg?raw';
import App from '@/arpa_reporter/App.vue';
import router from '@/arpa_reporter/router';
import store, { get } from '@/arpa_reporter/store';

import '@dvuckovic/vue3-bootstrap-icons/dist/style.css';

const app = createApp(App);

app.use(BootstrapVue);
injectBootstrapIcons(BootstrapIcons);
app.component('BIcon', BootstrapIcon);

async function main() {
  const session = await get('/api/sessions');
  const data = await session.json();

  if (data && data.user) {
    await store.dispatch('login', data.user);
  }

  // With the current session setup, we need router to initialize only after session info has been loaded into the store
  app.use(store);
  app.use(router);
  app.mount('#app');
}

main();

// NOTE: This file was copied from src/main.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z

/* eslint-disable import/first */
import { datadogRum } from '@datadog/browser-rum';

if (window.APP_CONFIG?.DD_RUM_ENABLED === true) {
  datadogRum.init(window.APP_CONFIG.DD_RUM_CONFIG);
  datadogRum.setGlobalContextProperty('app', 'arpa-reporter');
}

import { createApp } from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import App from '@/arpa_reporter/App.vue';
import router from '@/arpa_reporter/router';
import store, { get } from '@/arpa_reporter/store';

const app = createApp({
  router,
  store,
  ...App,
});

app.use(VueRouter);
app.use(Vuex);
app.use(BootstrapVue);
app.use(IconsPlugin);

async function main() {
  const session = await get('/api/sessions');
  const data = await session.json();

  if (data && data.user) {
    await store.dispatch('login', data.user);
  }

  app.mount('#app');
}

main();

// NOTE: This file was copied from src/main.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z

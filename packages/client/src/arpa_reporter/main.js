import Vue from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import App from './App.vue';
import router from './router/index';
import store, { get } from './store/index';

Vue.config.productionTip = false;

Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

async function main() {
  const session = await get('/api/sessions');
  const data = await session.json();

  if (data && data.user) {
    await store.dispatch('login', data.user);
  }

  new Vue({
    router,
    store,
    render: (h) => h(App),
  }).$mount('#app');
}

main();

// NOTE: This file was copied from src/main.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z

import Vue from 'vue'
import App from './App.vue'
import router from './router/index'
import store from './store/index'

Vue.config.productionTip = false

async function main () {
  const session = await fetch('/api/sessions')
  const data = await session.json()

  if (data && data.user) {
    await store.dispatch('login', data.user)
  }

  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
}

main()

// NOTE: This file was copied from src/main.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z

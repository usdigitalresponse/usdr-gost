import Vue from 'vue';
import Vuex from 'vuex';

import grants from './modules/grants';
import users from './modules/users';
import roles from './modules/roles';
import agencies from './modules/agencies';
import dashboard from './modules/dashboard';
import organization from './modules/organization';
import tenants from './modules/tenants';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

function randomId() {
  return Math.random().toString(16).substr(2, 10);
}

export default new Vuex.Store({
  strict: debug,
  modules: {
    grants,
    users,
    roles,
    agencies,
    dashboard,
    organization,
    tenants,
  },
  state: {
    alerts: {},
  },
  mutations: {
    addAlert(state, alert) {
      Vue.set(state.alerts, randomId(), alert);
    },
    dismissAlert(state, alertId) {
      Vue.delete(state.alerts, alertId);
    },
  },
});

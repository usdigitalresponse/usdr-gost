import Vue from 'vue';
import Vuex from 'vuex';

import grants from './modules/grants';
import users from './modules/users';
import roles from './modules/roles';
import agencies from './modules/agencies';
import dashboard from './modules/dashboard';
import organization from './modules/organization';
import tenants from './modules/tenants';
import alerts from './modules/alerts';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

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
    alerts,
  },
});

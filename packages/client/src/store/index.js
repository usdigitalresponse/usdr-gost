import Vue from 'vue';
import Vuex from 'vuex';

import grants from './modules/grants';
import users from './modules/users';
import roles from './modules/roles';
import agencies from './modules/agencies';
import dashboard from './modules/dashboard';

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
  },
});

import Vue from 'vue';
import Vuex from 'vuex';

import grants from './modules/grants';
import user from './modules/user';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  strict: debug,
  modules: {
    grants,
    user,
  },
});

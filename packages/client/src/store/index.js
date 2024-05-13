import Vue from 'vue';
import Vuex from 'vuex';

import grants from '@/store/modules/grants';
import users from '@/store/modules/users';
import roles from '@/store/modules/roles';
import agencies from '@/store/modules/agencies';
import organization from '@/store/modules/organization';
import tenants from '@/store/modules/tenants';
import alerts from '@/store/modules/alerts';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  strict: debug,
  modules: {
    grants,
    users,
    roles,
    agencies,
    organization,
    tenants,
    alerts,
  },
});

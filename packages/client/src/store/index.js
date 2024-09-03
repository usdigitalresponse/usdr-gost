import { createStore } from 'vuex';

import grants from '@/store/modules/grants';
import users from '@/store/modules/users';
import roles from '@/store/modules/roles';
import agencies from '@/store/modules/agencies';
import organization from '@/store/modules/organization';
import tenants from '@/store/modules/tenants';
import alerts from '@/store/modules/alerts';

const debug = import.meta.env.NODE_ENV !== 'production';

export default createStore({
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

const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    tenants: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    tenants: (state) => state.tenants,
  },
  actions: {
    fetchTenants({ commit }) {
      fetchApi.get('/api/organizations/:organizationId/tenants').then((data) => commit('SET_TENANTS', data));
    },
    async createTenants({ dispatch }, body) {
      await fetchApi.post('/api/organizations/:organizationId/tenants/', body);
      dispatch('fetchTenants');
    },
    async updateDisplayName({ dispatch }, { tenantId, displayName }) {
      await fetchApi.put(`/api/organizations/:organizationId/tenants/${tenantId}`, {
        displayName,
      });
      dispatch('fetchTenants');
    },
  },
  mutations: {
    SET_TENANTS(state, tenants) {
      state.tenants = tenants;
    },
  },
};

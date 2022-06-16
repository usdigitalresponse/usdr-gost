const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    agencies: [],
    tenant_agencies: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    agencies: (state) => state.agencies,
    tenant_agencies: (state) => state.tenant_agencies,
  },
  actions: {
    // new stuff
    fetchAgenciesForTenant({ commit }, tenantId) {
      fetchApi.get(`/api/organizations/:organizationId/agencies/${tenantId}/agencies`).then((data) => commit('SET_TENANT_AGENCIES', data));
    },
    fetchAgencies({ commit }) {
      fetchApi.get('/api/organizations/:organizationId/agencies').then((data) => commit('SET_AGENCIES', data));
    },
    async createAgency({ dispatch }, body) {
      await fetchApi.post('/api/organizations/:organizationId/agencies/', body);
      dispatch('fetchAgencies');
    },
    async updateThresholds({ dispatch }, { agencyId, warningThreshold, dangerThreshold }) {
      await fetchApi.put(`/api/organizations/:organizationId/agencies/${agencyId}`, {
        // Currently, agencies are seeded into db; only thresholds are mutable.
        warningThreshold,
        dangerThreshold,
      });
      dispatch('fetchAgencies');
    },
  },
  mutations: {
    SET_AGENCIES(state, agencies) {
      state.agencies = agencies;
    },
    SET_TENANT_AGENCIES(state, agencies) {
      state.tenant_agencies = agencies;
    },
  },
};

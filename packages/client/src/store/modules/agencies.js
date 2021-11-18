const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    agencies: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    agencies: (state) => state.agencies,
  },
  actions: {
    fetchAgencies({ commit }) {
      fetchApi.get('/api/organizations/:organizationId/agencies').then((data) => commit('SET_AGENCIES', data));
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
  },
};

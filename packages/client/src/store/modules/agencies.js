// eslint-disable-next-line import/extensions
// eslint-disable-next-line import/no-unresolved
// eslint-disable-next-line import/extensions
const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    agencies: [],
    allAgencies: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    agencies: (state) => state.agencies,
    allAgencies: (state) => state.allAgencies,
  },
  actions: {
    fetchAgencies({ commit }) {
      fetchApi.get('/api/organizations/:organizationId/agencies').then((data) => commit('SET_AGENCIES', data));
    },
    fetchAllAgencies({ commit }) {
      fetchApi.get('/api/organizations/:organizationId/allagencies').then((data) => commit('SET_ALL_AGENCIES', data));
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
    SET_ALL_AGENCIES(state, agencies) {
      state.allAgencies = agencies;
    },
  },
};

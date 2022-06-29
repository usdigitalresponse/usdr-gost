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
    async createAgency({ dispatch }, body) {
      await fetchApi.post('/api/organizations/:organizationId/agencies/', body);
      dispatch('fetchAgencies');
    },
    deleteAgency({ dispatch }, {
      agencyId, parent, name, abbreviation, warningThreshold, dangerThreshold,
    }) {
      console.log(`agencies      ${agencyId}`);
      fetchApi.deleteRequest(`/api/organizations/:organizationId/agencies/del/${agencyId}`, {
        parent,
        name,
        abbreviation,
        warningThreshold,
        dangerThreshold,
      });
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
    async updateAgencyName({ dispatch }, { agencyId, name }) {
      await fetchApi.put(`/api/organizations/:organizationId/agencies/name/${agencyId}`, {
        name,
      });
      dispatch('fetchAgencies');
    },
    async updateAgencyAbbr({ dispatch }, { agencyId, abbreviation }) {
      await fetchApi.put(`/api/organizations/:organizationId/agencies/abbr/${agencyId}`, {
        abbreviation,
      });
      dispatch('fetchAgencies');
    },
    async updateAgencyParent({ dispatch }, { agencyId, parentAgency }) {
      await fetchApi.put(`/api/organizations/:organizationId/agencies/parent/${agencyId}`, {
        parentAgency,
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

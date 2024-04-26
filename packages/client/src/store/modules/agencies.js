import * as fetchApi from '@/helpers/fetchApi';

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
    fetchAgencies({ commit, rootGetters }) {
      fetchApi.get(`/api/organizations/${rootGetters['users/selectedAgencyId']}/agencies`).then((data) => commit('SET_AGENCIES', data));
    },
    async createAgency({ dispatch, rootGetters }, body) {
      await fetchApi.post(`/api/organizations/${rootGetters['users/selectedAgencyId']}/agencies/`, body);
      dispatch('fetchAgencies');
    },
    async deleteAgency({ dispatch, rootGetters }, {
      agencyId, parent, name, abbreviation, warningThreshold, dangerThreshold,
    }) {
      await fetchApi.deleteRequest(`/api/organizations/${rootGetters['users/selectedAgencyId']}/agencies/del/${agencyId}`, {
        parent,
        name,
        abbreviation,
        warningThreshold,
        dangerThreshold,
      });
      dispatch('fetchAgencies');
    },
    async updateThresholds({ dispatch, rootGetters }, { agencyId, warningThreshold, dangerThreshold }) {
      await fetchApi.put(`/api/organizations/${rootGetters['users/selectedAgencyId']}/agencies/${agencyId}`, {
        // Currently, agencies are seeded into db; only thresholds are mutable.
        warningThreshold,
        dangerThreshold,
      });
      dispatch('fetchAgencies');
    },
    async updateAgencyName({ dispatch, rootGetters }, { agencyId, name }) {
      await fetchApi.put(`/api/organizations/${rootGetters['users/selectedAgencyId']}/agencies/name/${agencyId}`, {
        name,
      });
      dispatch('fetchAgencies');
    },
    async updateAgencyAbbr({ dispatch, rootGetters }, { agencyId, abbreviation }) {
      await fetchApi.put(`/api/organizations/${rootGetters['users/selectedAgencyId']}/agencies/abbr/${agencyId}`, {
        abbreviation,
      });
      dispatch('fetchAgencies');
    },
    async updateAgencyCode({ dispatch, rootGetters }, { agencyId, code }) {
      await fetchApi.put(`/api/organizations/${rootGetters['users/selectedAgencyId']}/agencies/code/${agencyId}`, {
        code,
      });
      dispatch('fetchAgencies');
    },
    async updateAgencyParent({ dispatch, rootGetters }, { agencyId, parentId }) {
      await fetchApi.put(`/api/organizations/${rootGetters['users/selectedAgencyId']}/agencies/parent/${agencyId}`, {
        parentId,
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

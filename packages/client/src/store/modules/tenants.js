import * as fetchApi from '@/helpers/fetchApi';

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
    fetchTenants({ commit, rootGetters }) {
      fetchApi.get(`/api/organizations/${rootGetters['users/selectedAgencyId']}/tenants`).then((data) => commit('SET_TENANTS', data));
    },
    async createTenant({ dispatch, rootGetters }, options) {
      await fetchApi.post(`/api/organizations/${rootGetters['users/selectedAgencyId']}/tenants/`, options);
      dispatch('fetchTenants');
    },
    async updateDisplayName({ dispatch, rootGetters }, { tenantId, displayName }) {
      await fetchApi.put(`/api/organizations/${rootGetters['users/selectedAgencyId']}/tenants/${tenantId}`, {
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

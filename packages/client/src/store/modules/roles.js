import * as fetchApi from '@/helpers/fetchApi';

function initialState() {
  return {
    roles: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    roles: (state) => state.roles,
  },
  actions: {
    fetchRoles({ commit }) {
      fetchApi.get('/api/organizations/:organizationId/roles').then((data) => commit('SET_ROLES', data));
    },
  },
  mutations: {
    SET_ROLES(state, roles) {
      state.roles = roles;
    },
  },
};

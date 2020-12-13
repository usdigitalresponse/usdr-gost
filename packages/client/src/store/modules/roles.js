const fetchApi = require('@/helpers/fetchApi');

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
      fetchApi.get('/api/roles').then((data) => commit('SET_ROLES', data));
    },
  },
  mutations: {
    SET_ROLES(state, roles) {
      state.roles = roles;
    },
  },
};

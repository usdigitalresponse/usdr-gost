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
      fetchApi.get('/api/agencies').then((data) => commit('SET_AGENCIES', data));
    },
  },
  mutations: {
    SET_AGENCIES(state, agencies) {
      state.agencies = agencies;
    },
  },
};

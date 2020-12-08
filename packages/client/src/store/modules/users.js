const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    loggedInUser: null,
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    loggedInUser: (state) => state.loggedInUser,
    agency: (state, getters) => (getters.loggedInUser ? getters.loggedInUser.agency : null),
  },
  actions: {
    login({ commit }, user) {
      commit('SET_LOGGED_IN_USER', user);
    },
    logout({ commit }) {
      fetchApi.get('/api/sessions/logout').then(() => commit('SET_LOGGED_IN_USER', null));
    },
  },
  mutations: {
    SET_LOGGED_IN_USER(state, user) {
      state.loggedInUser = user;
    },
  },
};

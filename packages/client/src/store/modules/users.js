const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    loggedInUser: null,
    users: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    loggedInUser: (state) => state.loggedInUser,
    users: (state) => state.users,
    agency: (state, getters) => (getters.loggedInUser ? getters.loggedInUser.agency : null),
  },
  actions: {
    login({ commit }, user) {
      commit('SET_LOGGED_IN_USER', user);
    },
    logout({ commit }) {
      fetchApi.get('/api/sessions/logout').then(() => commit('SET_LOGGED_IN_USER', null));
    },
    fetchUsers({ commit }) {
      fetchApi.get('/api/users').then((data) => commit('SET_USERS', data));
    },
    async createUser({ dispatch }, user) {
      await fetchApi.post('/api/users', user);
      dispatch('fetchUsers');
    },
    async deleteUser({ dispatch }, userId) {
      await fetchApi.deleteRequest(`/api/users/${userId}`);
      dispatch('fetchUsers');
    },
  },
  mutations: {
    SET_LOGGED_IN_USER(state, user) {
      state.loggedInUser = user;
    },
    SET_USERS(state, users) {
      state.users = users;
    },
  },
};

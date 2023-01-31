const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    keywords: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    keywords: (state) => state.keywords,
  },
  actions: {
    fetchKeywords({ commit }) {
      fetchApi.get('/api/organizations/:organizationId/keywords')
        .then((data) => commit('SET_KEYWORDS', data));
    },
    async createKeyword({ dispatch }, keyword) {
      await fetchApi.post('/api/organizations/:organizationId/keywords', keyword);
      dispatch('fetchKeywords');
    },
    async deleteKeyword({ dispatch }, keywordId) {
      await fetchApi.deleteRequest(`/api/organizations/:organizationId/keywords/${keywordId}`);
      dispatch('fetchKeywords');
    },
  },
  mutations: {
    SET_KEYWORDS(state, keywords) {
      state.keywords = keywords;
    },
  },
};

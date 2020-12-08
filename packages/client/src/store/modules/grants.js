const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    grantsPaginated: {},
    eligibilityCodes: [],
    keywords: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    grants: (state) => state.grantsPaginated.data,
    grantsPagination: (state) => state.grantsPaginated.pagination,
    eligibilityCodes: (state) => state.eligibilityCodes,
    keywords: (state) => state.keywords,
  },
  actions: {
    fetchGrants({ commit }, { currentPage, perPage }) {
      fetchApi.get(`/api/grants?currentPage=${currentPage}&perPage=${perPage}`)
        .then((r) => r.json())
        .then((data) => commit('SET_GRANTS', data));
    },
    markGrantAsViewed(test, { grantId, agencyId }) {
      fetchApi.put(`/api/grants/${grantId}/view/${agencyId}`);
    },
    fetchEligibilityCodes({ commit }) {
      fetchApi.get('/api/eligibility-codes')
        .then((r) => r.json())
        .then((data) => commit('SET_ELIGIBILITY_CODES', data));
    },
    fetchKeywords({ commit }) {
      fetchApi.get('/api/keywords')
        .then((r) => r.json())
        .then((data) => commit('SET_KEYWORDS', data));
    },
  },
  mutations: {
    SET_GRANTS(state, grants) {
      state.grantsPaginated = grants;
    },
    SET_ELIGIBILITY_CODES(state, eligibilityCodes) {
      state.eligibilityCodes = eligibilityCodes;
    },
    SET_KEYWORDS(state, keywords) {
      state.keywords = keywords;
    },
  },
};

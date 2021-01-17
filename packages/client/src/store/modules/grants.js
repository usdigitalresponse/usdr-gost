const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    grantsPaginated: {},
    eligibilityCodes: [],
    keywords: [],
    interestedCodes: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    grants: (state) => state.grantsPaginated.data || [],
    grantsPagination: (state) => state.grantsPaginated.pagination,
    eligibilityCodes: (state) => state.eligibilityCodes,
    interestedCodes: (state) => ({
      rejections: state.interestedCodes.filter((c) => c.is_rejection),
      interested: state.interestedCodes.filter((c) => !c.is_rejection),
    }),
    keywords: (state) => state.keywords,
  },
  actions: {
    fetchGrants({ commit }, {
      currentPage, perPage, orderBy, searchTerm,
    }) {
      return fetchApi.get(`/api/grants?currentPage=${currentPage}&perPage=${perPage}&orderBy=${orderBy}&searchTerm=${searchTerm}`)
        .then((data) => commit('SET_GRANTS', data));
    },
    markGrantAsViewed(context, { grantId, agencyId }) {
      return fetchApi.put(`/api/grants/${grantId}/view/${agencyId}`);
    },
    fetchInterestedAgencies(context, { grantId }) {
      return fetchApi.get(`/api/grants/${grantId}/interested`);
    },
    markGrantAsInterested(context, { grantId, agencyId, interestedCode }) {
      return fetchApi.put(`/api/grants/${grantId}/interested/${agencyId}`, {
        interestedCode,
      });
    },
    fetchEligibilityCodes({ commit }) {
      fetchApi.get('/api/eligibility-codes')
        .then((data) => commit('SET_ELIGIBILITY_CODES', data));
    },
    fetchInterestedCodes({ commit }) {
      fetchApi.get('/api/interested-codes')
        .then((data) => commit('SET_INTERESTED_CODES', data));
    },
    async setEligibilityCodeEnabled(context, { code, enabled }) {
      await fetchApi.put(`/api/eligibility-codes/${code}/enable/${enabled}`);
    },
    fetchKeywords({ commit }) {
      fetchApi.get('/api/keywords')
        .then((data) => commit('SET_KEYWORDS', data));
    },
    async createKeyword({ dispatch }, keyword) {
      await fetchApi.post('/api/keywords', keyword);
      dispatch('fetchKeywords');
    },
    async deleteKeyword({ dispatch }, keywordId) {
      await fetchApi.deleteRequest(`/api/keywords/${keywordId}`);
      dispatch('fetchKeywords');
    },
  },
  mutations: {
    SET_GRANTS(state, grants) {
      state.grantsPaginated = grants;
    },
    SET_ELIGIBILITY_CODES(state, eligibilityCodes) {
      state.eligibilityCodes = eligibilityCodes;
    },
    SET_INTERESTED_CODES(state, interestedCodes) {
      state.interestedCodes = interestedCodes;
    },
    SET_KEYWORDS(state, keywords) {
      state.keywords = keywords;
    },
  },
};

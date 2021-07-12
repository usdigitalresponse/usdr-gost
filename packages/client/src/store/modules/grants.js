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
      currentPage, perPage, orderBy, searchTerm, interestedByMe, assignedToMe,
    }) {
      const query = Object.entries({
        currentPage, perPage, orderBy, searchTerm, interestedByMe, assignedToMe,
      })
        // eslint-disable-next-line no-unused-vars
        .filter(([key, value]) => value)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      return fetchApi.get(`/api/grants?${query}`)
        .then((data) => commit('SET_GRANTS', data));
    },
    markGrantAsViewed(context, { grantId, agencyId }) {
      return fetchApi.put(`/api/grants/${grantId}/view/${agencyId}`);
    },
    getGrantAssignedUsers(context, { grantId }) {
      return fetchApi.get(`/api/grants/${grantId}/assign`);
    },
    assignUsersToGrant(context, { grantId, userIds }) {
      return fetchApi.put(`/api/grants/${grantId}/assign`, {
        userIds,
      });
    },
    unassignUsersToGrant(context, { grantId, userIds }) {
      return fetchApi.deleteRequest(`/api/grants/${grantId}/assign`, {
        userIds,
      });
    },
    async generateGrantForm(context, { grantId }) {
      const response = await fetchApi.get(`/api/grants/${grantId}/form/nevada_spoc`);
      const link = document.createElement('a');
      link.href = response.filePath;
      link.setAttribute('download', response.filePath);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
    },
    fetchInterestedAgencies(context, { grantId }) {
      return fetchApi.get(`/api/grants/${grantId}/interested`);
    },
    async markGrantAsInterested({ commit }, { grantId, agencyId, interestedCode }) {
      const interestedAgencies = await fetchApi.put(`/api/grants/${grantId}/interested/${agencyId}`, {
        interestedCode,
      });
      commit('UPDATE_GRANT', { grantId, data: { interested_agencies: interestedAgencies } });
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
    UPDATE_GRANT(state, { grantId, data }) {
      const grant = state.grantsPaginated.data.find((g) => g.grant_id === grantId);
      if (grant) {
        Object.assign(grant, data);
      }
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

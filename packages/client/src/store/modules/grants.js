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
      currentPage, perPage, orderBy, searchTerm, interestedByMe, assignedToAgency, aging,
    }) {
      const query = Object.entries({
        currentPage, perPage, orderBy, searchTerm, interestedByMe, assignedToAgency, aging,
      })
        // filter out undefined and nulls since api expects parameters not present as undefined
        // eslint-disable-next-line no-unused-vars
        .filter(([key, value]) => value || typeof value === 'number')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      return fetchApi.get(`/api/organizations/:organizationId/grants?${query}`)
        .then((data) => commit('SET_GRANTS', data));
    },
    markGrantAsViewed(context, { grantId, agencyId }) {
      return fetchApi.put(`/api/organizations/:organizationId/grants/${grantId}/view/${agencyId}`);
    },
    getGrantAssignedAgencies(context, { grantId }) {
      return fetchApi.get(`/api/organizations/:organizationId/grants/${grantId}/assign/agencies`);
    },
    getInterestedAgencies(context, { grantId }) {
      return fetchApi.get(`/api/organizations/:organizationId/grants/${grantId}/interested`);
    },
    assignAgenciesToGrant(context, { grantId, agencyIds }) {
      return fetchApi.put(`/api/organizations/:organizationId/grants/${grantId}/assign/agencies`, {
        agencyIds,
      });
    },
    unassignAgenciesToGrant(context, { grantId, agencyIds }) {
      return fetchApi.deleteRequest(`/api/organizations/:organizationId/grants/${grantId}/assign/agencies`, {
        agencyIds,
      });
    },
    unmarkGrantAsInterested(context, {
      grantId, agencyIds, interestedCode, agencyId,
    }) {
      return fetchApi.deleteRequest(`/api/organizations/:organizationId/grants/${grantId}/interested/${agencyId}`, {
        agencyIds,
        interestedCode,
      });
    },
    async generateGrantForm(context, { grantId }) {
      const response = await fetchApi.get(`/api/organizations/:organizationId/grants/${grantId}/form/nevada_spoc`);
      const link = document.createElement('a');
      link.href = response.filePath;
      link.setAttribute('download', response.filePath);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
    },
    fetchInterestedAgencies(context, { grantId }) {
      return fetchApi.get(`/api/organizations/:organizationId/grants/${grantId}/interested`);
    },
    async markGrantAsInterested({ commit }, { grantId, agencyId, interestedCode }) {
      const interestedAgencies = await fetchApi.put(`/api/organizations/:organizationId/grants/${grantId}/interested/${agencyId}`, {
        interestedCode,
      });
      commit('UPDATE_GRANT', { grantId, data: { interested_agencies: interestedAgencies } });
    },
    fetchEligibilityCodes({ commit }) {
      fetchApi.get('/api/organizations/:organizationId/eligibility-codes')
        .then((data) => commit('SET_ELIGIBILITY_CODES', data));
    },
    fetchInterestedCodes({ commit }) {
      fetchApi.get('/api/organizations/:organizationId/interested-codes')
        .then((data) => commit('SET_INTERESTED_CODES', data));
    },
    async setEligibilityCodeEnabled(context, { code, enabled }) {
      await fetchApi.put(`/api/organizations/:organizationId/eligibility-codes/${code}/enable/${enabled}`);
    },
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
    exportCSV(context, queryParams) {
      const query = Object.entries(queryParams)
        // filter out undefined and nulls since api expects parameters not present as undefined
        // eslint-disable-next-line no-unused-vars
        .filter(([key, value]) => value || typeof value === 'number')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      const navUrl = fetchApi.addOrganizationId(`/api/organizations/:organizationId/grants/exportCSV?${query}`);
      window.location = navUrl;
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

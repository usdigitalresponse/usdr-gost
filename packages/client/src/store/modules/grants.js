const fetchApi = require('@/helpers/fetchApi');

const { formatFilterDisplay } = require('@/helpers/filters');

function initialState() {
  return {
    grantsPaginated: {},
    eligibilityCodes: [],
    interestedCodes: [],
    grantsInterested: [],
    closestGrants: [],
    totalUpcomingGrants: 0,
    totalInterestedGrants: 0,
    currentGrant: {},
    searchFormFilters: {
      costSharing: null,
      opportunityStatuses: [],
      opportunityCategories: [],
      includeKeywords: null,
      excludeKeywords: null,
      opportunityNumber: null,
      postedWithin: null,
      fundingType: null,
      eligibility: null,
      reviewStatus: null,
    },
    savedSearches: {},
    selectedSearchId: null,
    selectedSearch: null,
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    grants: (state) => state.grantsPaginated.data || [],
    grantsPagination: (state) => state.grantsPaginated.pagination,
    grantsInterested: (state) => state.grantsInterested,
    closestGrants: (state) => state.closestGrants,
    totalUpcomingGrants: (state) => state.totalUpcomingGrants,
    totalInterestedGrants: (state) => state.totalInterestedGrants,
    currentGrant: (state) => state.currentGrant,
    eligibilityCodes: (state) => state.eligibilityCodes,
    interestedCodes: (state) => ({
      rejections: state.interestedCodes.filter((c) => c.status_code === 'Rejected'),
      result: state.interestedCodes.filter((c) => c.status_code === 'Result'),
      interested: state.interestedCodes.filter((c) => c.status_code === 'Interested'),
    }),
    activeFilters(state) {
      return formatFilterDisplay(state.searchFormFilters);
    },
    searchFormFilters(state) {
      return state.searchFormFilters;
    },
    savedSearches: (state) => state.savedSearches,
    selectedSearchId: (state) => state.selectedSearchId,
    selectedSearch: (state) => state.selectedSearch,
  },
  actions: {
    fetchGrants({ commit }, {
      currentPage, perPage, orderBy, orderDesc, searchTerm, interestedByMe,
      assignedToAgency, aging, positiveInterest, result, rejected, interestedByAgency,
      opportunityStatuses, opportunityCategories, costSharing,
    }) {
      const query = Object.entries({
        currentPage, perPage, orderBy, orderDesc, searchTerm, interestedByMe, assignedToAgency, aging, positiveInterest, result, rejected, interestedByAgency, opportunityStatuses, opportunityCategories, costSharing,
      })
        // filter out undefined and nulls since api expects parameters not present as undefined
        // eslint-disable-next-line no-unused-vars
        .filter(([key, value]) => value || typeof value === 'number')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      return fetchApi.get(`/api/organizations/:organizationId/grants?${query}`)
        .then((data) => commit('SET_GRANTS', data));
    },
    fetchGrantsNext({ commit }, {
      currentPage, perPage, orderBy, orderDesc, searchTerm, interestedByMe,
      assignedToAgency, showInterested, showResult, showRejected, aging, interestedByAgency,
    }) {
      // pull filters from state
      const { costSharing, opportunityStatuses, opportunityCategories } = this.state.grants.searchFormFilters;
      // review status filters can be in state or overridden based on how `fetchGrants` is called
      // this is to facilitate a grants table having default filters on those (i.e. My Grants)
      const reviewStatusFilters = this.state.grants.searchFormFilters.reviewStatusFilters || [];
      const positiveInterest = showInterested || reviewStatusFilters.includes('interested') ? true : null;
      const result = showResult || reviewStatusFilters.includes('result') ? true : null;
      const rejected = showRejected || reviewStatusFilters.includes('rejected') ? true : null;

      const query = Object.entries({
        currentPage, perPage, orderBy, orderDesc, searchTerm, interestedByMe, assignedToAgency, aging, positiveInterest, result, rejected, interestedByAgency, opportunityStatuses, opportunityCategories, costSharing,
      })
        // filter out undefined and nulls since api expects parameters not present as undefined
        // eslint-disable-next-line no-unused-vars
        .filter(([key, value]) => value || typeof value === 'number')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      return fetchApi.get(`/api/organizations/:organizationId/grants?${query}`)
        .then((data) => commit('SET_GRANTS', data));
    },
    fetchGrantsInterested({ commit }, { perPage, currentPage }) {
      return fetchApi.get(`/api/organizations/:organizationId/grants/grantsInterested/${perPage}/${currentPage}`)
        .then((data) => commit('SET_GRANTS_INTERESTED', data));
    },
    fetchClosestGrants({ commit }, { perPage, currentPage }) {
      return fetchApi.get(`/api/organizations/:organizationId/grants/closestGrants/${perPage}/${currentPage}`)
        .then((data) => commit('SET_CLOSEST_GRANTS', data));
    },
    fetchGrantDetails({ commit }, { grantId }) {
      return fetchApi.get(`/api/organizations/:organizationId/grants/${grantId}/grantDetails`)
        .then((data) => commit('SET_GRANT_CURRENT', data));
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
    fetchSavedSearches({ commit }) {
      // TODO: Add pagination URL parameters.
      fetchApi.get('/api/organizations/:organizationId/grants-saved-search')
        .then((data) => commit('SET_SAVED_SEARCHES', data));
    },
    async createSavedSearch(context, { searchInfo }) {
      return fetchApi.post('/api/organizations/:organizationId/grants-saved-search', searchInfo);
    },
    updateSavedSearch(context, { searchId, searchInfo }) {
      fetchApi.put(`/api/organizations/:organizationId/grants-saved-search/${searchId}`, searchInfo);
    },
    deleteSavedSearch(context, { searchId }) {
      fetchApi.deleteRequest(`/api/organizations/:organizationId/grants-saved-search/${searchId}`);
    },
    changeSelectedSearchId({ commit }, searchId) {
      commit('SET_SELECTED_SEARCH_ID', searchId);
    },
    exportCSV(context, queryParams) {
      const query = Object.entries(queryParams)
        // filter out undefined and nulls since api expects parameters not present as undefined
        // eslint-disable-next-line no-unused-vars
        .filter(([key, value]) => value || typeof value === 'number')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      const navUrl = fetchApi.apiURL(fetchApi.addOrganizationId(`/api/organizations/:organizationId/grants/exportCSV?${query}`));
      window.location = navUrl;
    },
    exportCSVRecentActivities() {
      window.location = fetchApi.apiURL(fetchApi.addOrganizationId('/api/organizations/:organizationId/grants/exportCSVRecentActivities'));
    },
    applyFilters(context, filters) {
      context.commit('APPLY_FILTERS', filters);
    },
    removeFilter(context, key) {
      context.commit('REMOVE_FILTER', key);
    },
    clearSelectedSearch(context) {
      context.commit('CLEAR_SEARCH');
    },
  },
  mutations: {
    SET_GRANTS(state, grants) {
      state.grantsPaginated = grants;
    },
    UPDATE_GRANT(state, { grantId, data }) {
      if (state.grantsPaginated.data) {
        const grant = state.grantsPaginated.data.find((g) => g.grant_id === grantId);
        if (grant) {
          Object.assign(grant, data);
        }
      }
      if (state.currentGrant && state.currentGrant.grant_id === grantId) {
        Object.assign(state.currentGrant, data);
      }
    },
    SET_ELIGIBILITY_CODES(state, eligibilityCodes) {
      state.eligibilityCodes = eligibilityCodes;
    },
    SET_INTERESTED_CODES(state, interestedCodes) {
      state.interestedCodes = interestedCodes;
    },
    SET_GRANTS_INTERESTED(state, grantsInterested) {
      state.grantsInterested = grantsInterested.data;
      state.totalInterestedGrants = grantsInterested.pagination.total;
    },
    SET_GRANT_CURRENT(state, currentGrant) {
      state.currentGrant = currentGrant;
    },
    SET_CLOSEST_GRANTS(state, closestGrants) {
      state.closestGrants = closestGrants.data;
      state.totalUpcomingGrants = closestGrants.pagination.total;
    },
    APPLY_FILTERS(state, filters) {
      state.searchFormFilters = filters;
    },
    REMOVE_FILTER(state, key) {
      state.searchFormFilters[key] = initialState().searchFormFilters[key];
    },
    CLEAR_SEARCH(state) {
      const emptyState = initialState();
      state.searchFormFilters = emptyState.searchFormFilters;
      state.selectedSearch = emptyState.selectedSearch;
      state.selectedSearchId = emptyState.selectedSearchId;
    },
    SET_SAVED_SEARCHES(state, savedSearches) {
      state.savedSearches = savedSearches;
    },
    SET_SELECTED_SEARCH_ID(state, searchId) {
      if (searchId === null || searchId === undefined || Number.isNaN(searchId)) {
        state.selectedSearchId = null;
        state.selectedSearch = null;
        return;
      }
      state.selectedSearchId = searchId;
      const data = state.savedSearches.data || [];
      state.selectedSearch = data.find((search) => search.id === searchId);
    },
  },
};

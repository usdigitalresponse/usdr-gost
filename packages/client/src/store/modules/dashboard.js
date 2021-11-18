const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    dashboard: {},
    totalGrants: null,
    totalGrantsMatchingAgencyCriteria: null,
    totalViewedGrants: null,
    totalInterestedGrants: null,
    grantsCreatedInTimeframe: null,
    grantsCreatedInTimeframeMatchingCriteria: null,
    grantsUpdatedInTimeframe: null,
    grantsUpdatedInTimeframeMatchingCriteria: null,
    totalInterestedGrantsByAgencies: null,
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    dashboard: (state) => state.dashboard,
    totalGrants: (state) => state.totalGrants,
    totalGrantsMatchingAgencyCriteria: (state) => state.totalGrantsMatchingAgencyCriteria,
    totalViewedGrants: (state) => state.totalViewedGrants,
    totalInterestedGrants: (state) => state.totalInterestedGrants,
    grantsCreatedInTimeframe: (state) => state.grantsCreatedInTimeframe,
    grantsCreatedInTimeframeMatchingCriteria: (state) => state.grantsCreatedInTimeframeMatchingCriteria,
    grantsUpdatedInTimeframe: (state) => state.grantsUpdatedInTimeframe,
    grantsUpdatedInTimeframeMatchingCriteria: (state) => state.grantsUpdatedInTimeframeMatchingCriteria,
    totalInterestedGrantsByAgencies: (state) => state.totalInterestedGrantsByAgencies,
  },
  actions: {
    async fetchDashboard({ commit }) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const timestampQueryString = twentyFourHoursAgo.toISOString();
      const result = await fetchApi.get(`/api/organizations/:organizationId/dashboard?totalGrants=true&totalViewedGrants=true&totalInterestedGrants=true&grantsCreatedFromTs=${timestampQueryString}&grantsUpdatedFromTs=${timestampQueryString}&totalInterestedGrantsByAgencies=true`);
      if (result.totalGrants) {
        commit('SET_TOTAL_GRANTS', result.totalGrants);
      }
      if (result.totalGrantsMatchingAgencyCriteria) {
        commit('SET_TOTAL_GRANTS_MATCHING_AGENCY_CRITERIA', result.totalGrantsMatchingAgencyCriteria);
      }
      if (result.totalViewedGrants) {
        commit('SET_TOTAL_VIEWED_GRANTS', result.totalViewedGrants);
      }
      if (result.totalInterestedGrants) {
        commit('SET_TOTAL_INTERESTED_GRANTS', result.totalInterestedGrants);
      }
      if (result.grantsCreatedInTimeframe) {
        commit('SET_GRANTS_CREATED_IN_TIMEFRAME', result.grantsCreatedInTimeframe);
      }
      if (result.grantsCreatedInTimeframeMatchingCriteria) {
        commit('SET_GRANTS_CREATED_IN_TIMEFRAME_MATCHING_CRITERIA', result.grantsCreatedInTimeframeMatchingCriteria);
      }
      if (result.grantsUpdatedInTimeframe) {
        commit('SET_GRANTS_UPDATED_IN_TIMEFRAME', result.grantsUpdatedInTimeframe);
      }
      if (result.grantsUpdatedInTimeframeMatchingCriteria) {
        commit('SET_GRANTS_UPDATED_IN_TIMEFRAME_MATCHING_CRITERIA', result.grantsUpdatedInTimeframeMatchingCriteria);
      }
      if (result.totalInterestedGrantsByAgencies) {
        commit('SET_TOTAL_TOTAL_INTERESTED_GRANTS_BY_AGENCIES', result.totalInterestedGrantsByAgencies);
      }
    },
  },
  mutations: {
    SET_TOTAL_GRANTS(state, data) {
      state.totalGrants = data;
    },
    SET_TOTAL_GRANTS_MATCHING_AGENCY_CRITERIA(state, data) {
      state.totalGrantsMatchingAgencyCriteria = data;
    },
    SET_TOTAL_VIEWED_GRANTS(state, data) {
      state.totalViewedGrants = data;
    },
    SET_TOTAL_INTERESTED_GRANTS(state, data) {
      state.totalInterestedGrants = data;
    },
    SET_GRANTS_CREATED_IN_TIMEFRAME(state, data) {
      state.grantsCreatedInTimeframe = data;
    },
    SET_GRANTS_CREATED_IN_TIMEFRAME_MATCHING_CRITERIA(state, data) {
      state.grantsCreatedInTimeframeMatchingCriteria = data;
    },
    SET_GRANTS_UPDATED_IN_TIMEFRAME(state, data) {
      state.grantsUpdatedInTimeframe = data;
    },
    SET_GRANTS_UPDATED_IN_TIMEFRAME_MATCHING_CRITERIA(state, data) {
      state.grantsUpdatedInTimeframeMatchingCriteria = data;
    },
    SET_TOTAL_TOTAL_INTERESTED_GRANTS_BY_AGENCIES(state, data) {
      state.totalInterestedGrantsByAgencies = data;
    },
    SET_DASHBOARD(state, dashboard) {
      state.dashboard = dashboard;
    },
  },
};

const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    dashboard: {},
    totalGrants: null,
    totalGrantsMatchingAgencyCriteria: null,
    totalViewedGrants: null,
    totalInterestedGrants: null,
    totalGrantsInTimeframe: null,
    totalGrantsInTimeframeMatchingCriteria: null,
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
    totalGrantsInTimeframe: (state) => state.totalGrantsInTimeframe,
    totalGrantsInTimeframeMatchingCriteria: (state) => state.totalGrantsInTimeframeMatchingCriteria,
    totalInterestedGrantsByAgencies: (state) => state.totalInterestedGrantsByAgencies,
  },
  actions: {
    async fetchDashboard({ commit }) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await fetchApi.get(`/api/dashboard?totalGrants=true&totalViewedGrants=true&totalInterestedGrants=true&totalGrantsFromTs=${twentyFourHoursAgo.toISOString()}&totalInterestedGrantsByAgencies=true`);
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
      if (result.totalGrantsInTimeframe) {
        commit('SET_TOTAL_24HR_GRANTS', result.totalGrantsInTimeframe);
      }
      if (result.totalGrantsInTimeframeMatchingCriteria) {
        commit('SET_TOTAL_24HR_GRANTS_MATCHING_CRITERIA', result.totalGrantsInTimeframeMatchingCriteria);
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
    SET_TOTAL_24HR_GRANTS(state, data) {
      state.totalGrantsInTimeframe = data;
    },
    SET_TOTAL_24HR_GRANTS_MATCHING_CRITERIA(state, data) {
      state.totalGrantsInTimeframeMatchingCriteria = data;
    },
    SET_TOTAL_TOTAL_INTERESTED_GRANTS_BY_AGENCIES(state, data) {
      state.totalInterestedGrantsByAgencies = data;
    },
    SET_DASHBOARD(state, dashboard) {
      state.dashboard = dashboard;
    },
  },
};

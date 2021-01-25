const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    dashboard: {},
    totalGrants: null,
    totalViewedGrants: null,
    totalInterestedGrants: null,
    totalGrantsBetweenDates: null,
    totalInterestedGrantsByAgencies: null,
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    dashboard: (state) => state.dashboard,
    totalGrants: (state) => state.totalGrants,
    totalViewedGrants: (state) => state.totalViewedGrants,
    totalInterestedGrants: (state) => state.totalInterestedGrants,
    totalGrantsBetweenDates: (state) => state.totalGrantsBetweenDates,
    totalInterestedGrantsByAgencies: (state) => state.totalInterestedGrantsByAgencies,
  },
  actions: {
    async fetchDashboard({ commit }) {
      const date = new Date();
      const today = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const yesterday = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

      yesterday.setDate(yesterday.getDate() - 1);
      const dateQueryString = `${yesterday.toISOString().split('T')[0]}|${today.toISOString().split('T')[0]}`;
      const result = await fetchApi.get(`/api/dashboard?totalGrants=true&totalViewedGrants=true&totalInterestedGrants=true&totalGrantsBetweenDates=${dateQueryString}&totalInterestedGrantsByAgencies=true`);
      if (result.totalGrants) {
        commit('SET_TOTAL_GRANTS', result.totalGrants);
      }
      if (result.totalViewedGrants) {
        commit('SET_TOTAL_VIEWED_GRANTS', result.totalViewedGrants);
      }
      if (result.totalInterestedGrants) {
        commit('SET_TOTAL_INTERESTED_GRANTS', result.totalInterestedGrants);
      }
      if (result.totalGrantsBetweenDates) {
        commit('SET_TOTAL_24HR_GRANTS', result.totalGrantsBetweenDates);
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
    SET_TOTAL_VIEWED_GRANTS(state, data) {
      state.totalViewedGrants = data;
    },
    SET_TOTAL_INTERESTED_GRANTS(state, data) {
      state.totalInterestedGrants = data;
    },
    SET_TOTAL_24HR_GRANTS(state, data) {
      state.totalGrantsBetweenDates = data;
    },
    SET_TOTAL_TOTAL_INTERESTED_GRANTS_BY_AGENCIES(state, data) {
      state.totalInterestedGrantsByAgencies = data;
    },
    SET_DASHBOARD(state, dashboard) {
      state.dashboard = dashboard;
    },
  },
};

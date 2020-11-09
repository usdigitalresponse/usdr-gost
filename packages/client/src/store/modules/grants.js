export function get(url) {
  const options = {
  };
  return fetch(`${process.env.VUE_APP_GRANTS_API_URL}${url}`, options);
}

export function post(url, body) {
  const options = {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
  return fetch(`${process.env.VUE_APP_GRANTS_API_URL}${url}`, options).then((r) => {
    if (r.ok) {
      return r.json();
    }
    return r
      .text()
      .then((text) => Promise.reject(new Error(text || r.statusText)));
  });
}

function initialState() {
  return {
    grants: [],
    eligibilityCodes: [],
    keywords: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    grants: (state) => state.grants,
    eligibilityCodes: (state) => state.eligibilityCodes,
    keywords: (state) => state.keywords,
  },
  actions: {
    fetchGrants({ commit }) {
      get('/api/grants')
        .then((r) => r.json())
        .then((data) => commit('SET_GRANTS', data));
    },
    fetchEligibilityCodes({ commit }) {
      get('/api/eligibility-codes')
        .then((r) => r.json())
        .then((data) => commit('SET_ELIGIBILITY_CODES', data));
    },
    fetchKeywords({ commit }) {
      get('/api/keywords')
        .then((r) => r.json())
        .then((data) => commit('SET_KEYWORDS', data));
    },
  },
  mutations: {
    SET_GRANTS(state, grants) {
      state.grants = grants;
    },
    SET_ELIGIBILITY_CODES(state, eligibilityCodes) {
      state.eligibilityCodes = eligibilityCodes;
    },
    SET_KEYWORDS(state, keywords) {
      state.keywords = keywords;
    },
  },
};

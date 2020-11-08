console.log(process.env);
console.log('process.env.VUE_APP_GRANTS_API_URL');
console.log(process.env.VUE_APP_GRANTS_API_URL);
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
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    grants: (state) => state.grants,
  },
  actions: {
    fetchGrants({ commit }) {
      get('/api/grants')
        .then((r) => r.json())
        .then((data) => commit('SET_GRANTS', data));
    },
  },
  mutations: {
    SET_GRANTS(state, grants) {
      state.grants = grants;
    },
  },
};

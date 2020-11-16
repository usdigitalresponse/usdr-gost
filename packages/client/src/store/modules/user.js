function initialState() {
  return {
    agency: { id: 1, name: 'department of health' },
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    agency: (state) => state.agency,
  },
  actions: {

  },
  mutations: {

  },
};

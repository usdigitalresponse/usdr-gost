/* organization.js
  The currentOrganization is the organization whose data is being displayed
  in the UI.
  On login, this will be the organization of the user, but if that user's
  organization has sub-organizations (for example a user's organization might
  be a state, which has agencies as sub-organizations), then the user can
  navigate to one of those sub-organizations and view its data.
  All the organizations are subsidary to USDR, so a USDR user can view
  any of them.
*/
function initialState() {
  return {
    currentOrganization: null,
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    currentOrganization: (state) => state.currentOrganization,
  },
  mutations: {
    SET_CURRENT_ORGANIZATION(state, organization) {
      state.currentOrganization = organization;
    },
  },
};

<template>
  <div class="saved-search-panel">
    <b-button @click="initManageSearches" variant="primary" size="sm">
      My Saved Searches
    </b-button>
    <b-sidebar
      id="saved-search-panel"
      model="displaySavedSearchPanel"
      ref="savedSearchPanel"
      bg-variant="white"
      width="480px"
      @hidden="cancel"
      backdrop
      right
      shadow
    >
    <template #header>
      <div class="saved-search-title">Saved Searches</div>
      <b-button-close type="button" class="close" @click="initViewResults">
      </b-button-close>
    </template>
    <div class="saved-search-empty-state" v-if="emptyState">
      <h4>No saved searches</h4>
      <div>Save search criteria to easily apply or share a search</div>
      <b-button @click="newSavedSearch" variant="outline-primary" size="sm">
        New Search
      </b-button>
    </div>
    <b-table
      id="saved-searches-table"
      :items="savedSearches.data"
      :fields="savedSearchFields"
      hover
      thead-class="saved-search-table-header-class"
    >
      <template #cell(searchinfo)="data">
        <div>
          <b-row>
            <b-col cols="10"><b>{{  data.item.name }}</b></b-col>
            <b-col cols="1">
              <b-dropdown class="saved-search-settings-dropdown" size="sm"  variant="link" toggle-class="text-decoration-none" no-caret>
                <template #button-content>
                  <b-icon icon="three-dots-vertical" class="text-dark" font-scale="1"></b-icon>
                </template>
                <b-dropdown-item :searchId="data.item.id" @click.stop="editSavedSearch">Edit</b-dropdown-item>
                <b-dropdown-item @click.stop="deleteSavedSearch" :searchId="data.item.id">Delete</b-dropdown-item>
              </b-dropdown>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="9">
              <!-- TODO: Change this to updatedAt -->
              Last used {{ new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(data.item.createdAt)) }}
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="9">
              <div v-for="(field, idx) of formatCriteria(data.item.criteria)" :key="idx">
                {{ field.label }}: {{ field.value }}
              </div>
            </b-col>
          </b-row>
        </div>
      </template>
    </b-table>
    <template #footer="{ hide }">
     <div class="d-flex text-light align-items-center px-3 py-2 saved-search-footer-div">
      <b-pagination
        class="m-0 saved-search-pagination"
        v-model="currentPage"
        :total-rows="totalRows"
        :per-page="perPage"
        aria-controls="saved-searches-table"
        size="sm" />
      <b-button size="sm" @click="hide" variant="outline-primary" class="borderless-button">Close</b-button>
     </div>
    </template>
    </b-sidebar>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { VBToggle } from 'bootstrap-vue';

import { formatFilterDisplay } from '@/helpers/filters';

export default {
  props: {
    showModal: Boolean,
  },
  directives: {
    'v-b-toggle': VBToggle,
  },
  data() {
    return {
      perPage: 10,
      currentPage: 1,
      loading: false,
      savedSearchFields: [{ key: 'searchinfo', label: 'Saved Search' }],
    };
  },
  validations: {},
  watch: {
    displaySavedSearchPanel() {
      if (this.displaySavedSearchPanel) {
        this.$root.$emit('bv::toggle::collapse', 'saved-search-panel');
      } else {
        this.$refs.savedSearchPanel.hide();
      }
    },
    currentPage() {
      if (this.loading) {
        return;
      }
      this.fetchSavedSearches({
        perPage: this.perPage,
        currentPage: this.currentPage,
      });
    },
  },
  computed: {
    ...mapGetters({
      savedSearches: 'grants/savedSearches',
      displaySavedSearchPanel: 'grants/displaySavedSearchPanel',
      selectedSearchId: 'grants/selectedSearchId',
    }),
    totalRows() {
      return this.savedSearches && this.savedSearches.pagination ? this.savedSearches.pagination.total : 0;
    },
    emptyState() {
      return this.savedSearches.data && this.savedSearches.data.length === 0;
    },
  },
  mounted() {
    this.setup();
  },
  methods: {
    ...mapActions({
      createSavedSearch: 'grants/createSavedSearch',
      updateSavedSearch: 'grants/updateSavedSearch',
      deleteSavedSearchAPI: 'grants/deleteSavedSearch',
      fetchSavedSearches: 'grants/fetchSavedSearches',
      changeSelectedSearchId: 'grants/changeSelectedSearchId',
      clearSelectedSearch: 'grants/clearSelectedSearch',
      applyFilters: 'grants/applyFilters',
      initManageSearches: 'grants/initManageSearches',
      initEditSearch: 'grants/initEditSearch',
      initNewSearch: 'grants/initNewSearch',
      initViewResults: 'grants/initViewResults',
    }),
    setup() {
      this.fetchSavedSearches({
        perPage: this.perPage,
        currentPage: this.currentPage,
      });
      if (this.displaySavedSearchPanel) {
        this.$root.$emit('bv::toggle::collapse', 'saved-search-panel');
      }
    },
    editSavedSearch(e) {
      const searchId = e.target.getAttribute('searchid');
      this.initEditSearch(searchId);
    },
    newSavedSearch() {
      this.initNewSearch();
    },
    async deleteSavedSearch(e) {
      const searchId = `${e.target.getAttribute('searchid')}`;
      await this.deleteSavedSearchAPI({ searchId });
      if (this.selectedSearchId === Number(searchId)) {
        this.clearSelectedSearch();
      }
      this.fetchSavedSearches({
        perPage: this.perPage,
        currentPage: this.currentPage,
      });
      this.notifyDeleted();
    },
    appylySavedSearch(searchId) {
      const searchData = this.savedSearches.data.find((search) => search.id === searchId);
      this.changeSelectedSearchId(searchId);
      this.applyFilters(JSON.parse(searchData.criteria));
      this.initViewResults();
    },
    formatCriteria(criteria) {
      const criteriaObj = JSON.parse(criteria);
      return formatFilterDisplay(criteriaObj);
    },
    notifyDeleted() {
      this.$bvToast.toast('Search deleted', {
        title: 'Success',
        variant: 'success',
        solid: true,
        autoHideDelay: 2500,
        toaster: 'b-toaster-bottom-right',
      });
    },
    cancel() {
      // something closed the sidebar outside of the state store actions
      // so we need to reset the state
      if (this.displaySavedSearchPanel) {
        this.initViewResults();
      }
    },
  },
};
</script>
<style>
.saved-search-panel .saved-search-title{
  font-style: normal;
  font-weight: 700;
  font-size: 17px;
  line-height: 120%;
}

.saved-search-panel .b-sidebar-header{
  justify-content: space-between;
  border-bottom: solid #DAE0E5;
}
.saved-search-panel .b-sidebar.b-sidebar-right > .b-sidebar-header .close{
  margin-right: 0px;
}

.saved-search-panel .b-sidebar-footer{
  display: flex;
  border-top: solid #DAE0E5;
}

.saved-search-panel .saved-search-row{
  padding-left: 15px;
  padding-right: 15px;
}
.saved-search-panel .saved-search-row:hover{
  background: rgba(0, 0, 0, 0.075);
}
.saved-search-panel .saved-search-settings-dropdown > button {
  padding-bottom: 0;
}

.saved-search-panel .saved-search-empty-state{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-style: normal;
}
.saved-search-panel .saved-search-empty-state > h4{
  font-weight: 700;
  font-size: 16px;
  line-height: 120%;
}
.saved-search-panel .saved-search-empty-state > span{
  font-weight: 500;
  font-size: 14px;
  line-height: 150%;
}
.saved-search-panel .saved-search-table-header-class {
  display: none;
}
.saved-search-panel .saved-search-pagination {
  align-items: center;
}
.saved-search-panel .saved-search-footer-div {
  width: 100%;
  justify-content: space-between;
}
</style>

<template>
  <div>
    <b-button @click="initManageSearches" variant="primary" size="sm">
      My Saved Searches
    </b-button>
    <b-sidebar
      id="saved-search-panel"
      class="saved-search-panel"
      model="displaySavedSearchPanel"
      ref="savedSearchPanel"
      bg-variant="white"
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
    <section class="container-fluid p-0" style="overflow-x: hidden;" v-if="!emptyState">
      <div v-for="(search,idx) in savedSearches.data" :key="idx" class="saved-search-row" :searchid="search.id" @click="appylySavedSearch(search.id)" >
        <b-row>
          <b-col cols="10"><b>{{  search.name }}</b></b-col>
          <b-col cols="1">
            <b-dropdown size="sm"  variant="link" toggle-class="text-decoration-none" no-caret>
              <template #button-content>
                <b-icon icon="three-dots-vertical" class="text-dark" font-scale="1"></b-icon>
              </template>
              <b-dropdown-item :searchId="search.id" @click.stop="editSavedSearch">Edit</b-dropdown-item>
              <b-dropdown-item @click="deleteSavedSearch" :searchId="search.id">Delete</b-dropdown-item>
            </b-dropdown>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="9">
            <!-- TODO: Change this to updatedAt -->
            Last used {{ new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(search.createdAt)) }}
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="9">
            <div v-for="(field, idx) of formatCriteria(search.criteria)" :key="idx">
              {{ field.label }}: {{ field.value }}
            </div>
          </b-col>
        </b-row>
        <hr />
      </div>
    </section>
    <template #footer="{ hide }">
     <div class="d-flex text-light align-items-center px-3 py-2">
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
    return {};
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
  },
  computed: {
    ...mapGetters({
      savedSearches: 'grants/savedSearches',
      displaySavedSearchPanel: 'grants/displaySavedSearchPanel',
    }),
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
      applyFilters: 'grants/applyFilters',
      initManageSearches: 'grants/initManageSearches',
      initEditSearch: 'grants/initEditSearch',
      initNewSearch: 'grants/initNewSearch',
      initViewResults: 'grants/initViewResults',
    }),
    setup() {
      this.fetchSavedSearches();
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
    deleteSavedSearch(e) {
      const searchId = `${e.target.getAttribute('searchid')}`;
      this.deleteSavedSearchAPI({ searchId });
      this.fetchSavedSearches();
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
  },
};
</script>
<style>
.saved-search-title{
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 120%;
}
.b-sidebar.b-sidebar-right > .b-sidebar-header .close{
  margin-right: 0px;
}
.b-sidebar-header{
  justify-content: space-between;
  border-bottom: solid #DAE0E5;
}
.b-sidebar-body{
  display: flex;
}
.b-sidebar-footer{
  display: flex;
  justify-content: end;
  border-top: solid #DAE0E5;
}
.saved-search-empty-state{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-style: normal;
}
.saved-search-empty-state > h4{
  font-weight: 700;
  font-size: 16px;
  line-height: 120%;
}
.saved-search-empty-state > span{
  font-weight: 500;
  font-size: 14px;
  line-height: 150%;
}
.saved-search-row{
  padding-left: 15px;
}
.saved-search-row:hover{
  background: rgba(0, 0, 0, 0.075);
}

</style>

<template>
  <div>
    <b-button v-b-toggle.saved-search-panel variant="primary" size="sm">
      My Saved Searches
    </b-button>
    <b-sidebar
      id="saved-search-panel"
      class="saved-search-panel"
      right
      shadow
    >
    <template #header="{ hide }">
      <div class="saved-search-title">Saved Searches</div>
      <b-button type="button" class="close" aria-label="Close" @click="hide">
       <span aria-hidden="true">&times;</span>
      </b-button>
    </template>
    <div class="saved-search-empty-state" v-if="emptyState">
      <h4>No saved searches</h4>
      <div>Save search criteria to easily apply or share a search</div>
      <b-button @click="newSavedSearch" variant="outline-primary" size="sm">
        New Search
      </b-button>
    </div>
    <section class="container-fluid" v-if="!emptyState">
      <div v-for="(search,idx) in savedSearches.data" :key="idx" class="saved-search-row" :searchid="search.id" @click="appylySavedSearch(search.id)" >
        <b-row>
          <b-col cols="9"><b>{{  search.name }}</b></b-col>
          <b-col cols="1">
            <b-dropdown size="sm"  variant="link" toggle-class="text-decoration-none" no-caret>
              <template #button-content>
                <b-icon icon="three-dots-vertical" font-scale="1"></b-icon>
              </template>
              <b-dropdown-item :searchId="search.id" @click="editSavedSearch">Edit</b-dropdown-item>
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
  watch: {},
  computed: {
    ...mapGetters({
      savedSearches: 'grants/savedSearches',
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
    }),
    setup() {
      this.fetchSavedSearches();
    },
    editSavedSearch(e) {
      const searchId = e.target.getAttribute('searchid');
      // this.changeSelectedSearchId();
      this.$root.$emit('bv::toggle::collapse', 'saved-search-panel');
      this.$emit('edit-filter', searchId);
    },
    newSavedSearch() {
      this.$root.$emit('bv::toggle::collapse', 'saved-search-panel');
      this.$emit('edit-filter');
    },
    deleteSavedSearch(e) {
      const searchId = `${e.target.getAttribute('searchid')}`;
      this.deleteSavedSearchAPI({ searchId });
      this.$root.$emit('bv::toggle::collapse', 'saved-search-panel');
      this.fetchSavedSearches();
    },
    appylySavedSearch(searchId) {
      const searchData = this.savedSearches.data.find((search) => search.id === searchId);
      this.changeSelectedSearchId(searchId);
      this.applyFilters(JSON.parse(searchData.criteria));
      this.$emit('filters-applied');
      this.$root.$emit('bv::toggle::collapse', 'saved-search-panel');
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
.saved-search-row:hover{
  background: rgba(0, 0, 0, 0.075);
}
</style>

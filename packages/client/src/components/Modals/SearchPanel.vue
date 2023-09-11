<template>
    <div>
      <b-button @click="initNewSearch" variant="outline-primary" size="sm">
        New Search
      </b-button>
      <b-sidebar
        id="search-panel"
        ref="searchPanelSideBar"
        title="Search"
        class="search-panel"
        bg-variant="white"
        @shown="onShown"
        @hidden="cancel"
        backdrop
        right
        shadow
      >
        <template #header>
          <div class="search-panel-title">{{ panelTitle }}</div>
          <b-button-close class="close" @click="cancel">
          </b-button-close>
        </template>
        <form ref="form" class="search-form">
          <b-form-group label-for="searchTitle">
            <template slot="label"><b>Search Title</b></template>
              <b-form-input
                id="searchTitle"
                type="text"
                v-model="formData.searchTitle"
              ></b-form-input>
              <b-form-text id="input-live-help">ex. Infrastructure</b-form-text>
          </b-form-group>
          <b-form-group label-for="include-input">
            <template slot="label">Include Keywords</template>
              <b-form-input
                id="include-input"
                type="text"
                v-model="formData.criteria.includeKeywords"
              ></b-form-input>
              <b-form-text id="input-live-help">Separate keywords with comma</b-form-text>
          </b-form-group>
          <b-form-group label-for="exclude-input">
            <template slot="label">Exclude Keywords</template>
              <b-form-input
                id="exclude-input"
                type="text"
                v-model="formData.criteria.excludeKeywords"
              ></b-form-input>
              <b-form-text id="input-live-help">Separate keywords with comma</b-form-text>
          </b-form-group>
          <b-form-group label-for="opportunity-number-input">
            <template slot="label">Opportunity #</template>
              <b-form-input
                id="opportunity-number-input"
                v-model="formData.criteria.opportunityNumber"
              ></b-form-input>
          </b-form-group>
          <b-form-group label="Opportunity Status" v-slot="{ ariaDescribedby }">
            <b-form-checkbox-group
              id="opportunity-status"
              v-model="formData.criteria.opportunityStatuses"
              :aria-describedby="ariaDescribedby"
              name="opportunity-status"
              inline
            >
              <b-form-checkbox value="forecasted">Forecasted</b-form-checkbox>
              <b-form-checkbox value="posted">Posted</b-form-checkbox>
              <b-form-checkbox value="closed">Closed</b-form-checkbox>
            </b-form-checkbox-group>
          </b-form-group>
          <b-form-group class="multiselect-group" label-for="funding-type">
            <template slot="label">Funding Type</template>
              <multiselect
                v-model="formData.criteria.fundingTypes"
                :options="fundingTypeOptions"
                track-by="code"
                label="name"
                id="funding-type"
                type="text"
                :multiple="true"
              ></multiselect>
          </b-form-group>
          <b-form-group class="multiselect-group">
            <template slot="label">Eligibility</template>
            <multiselect
              v-model="formData.criteria.eligibility"
              :options="eligibilityCodes"
              track-by="code"
              label="label"
              id="eligibility"
              type="text"
              :multiple="true"
            >
            </multiselect>
          </b-form-group>
          <b-form-group class="multiselect-group">
            <template slot="label">Category</template>
            <multiselect
              v-model="formData.criteria.opportunityCategories"
              :options="opportunityCategoryOptions"
              :multiple="true"
              :limit="1"
              :limitText="customLimitText"
              :close-on-select="false"
              :clear-on-select="false"
              placeholder="Opportunity Category"
              :show-labels="false"
              :searchable="false">
            </multiselect>
          </b-form-group>
          <b-form-group label-for="bill">
            <template slot="label">Bill</template>
              <multiselect
              id="bill"
              v-model="formData.criteria.bill"
              open-direction="top"
              :options="billOptions"
              :multiple="false"
              :close-on-select="true"
              :clear-on-select="false"
              placeholder="All Bills"
              :show-labels="false">
            </multiselect>
          </b-form-group>
          <b-form-group label-for="agency">
            <template slot="label">Agency Code</template>
              <b-form-input
                id="agency"
                type="text"
                v-model="formData.criteria.agency"
              ></b-form-input>
          </b-form-group>
          <b-form-group>
            <template slot="label">Posted Within</template>
            <multiselect
              id="posted-within"
              v-model="formData.criteria.postedWithin"
              :options="postedWithinOptions"
              :multiple="false"
              :close-on-select="true"
              :clear-on-select="false"
              placeholder="All Time"
              :show-labels="false">
            </multiselect>
          </b-form-group>
          <b-form-group label="Cost Sharing" v-slot="{ ariaDescribedby }" row>
            <b-form-radio-group>
              <b-form-radio v-model="formData.criteria.costSharing" :aria-describedby="ariaDescribedby" name="cost-sharing" value="Yes">Yes</b-form-radio>
              <b-form-radio v-model="formData.criteria.costSharing" :aria-describedby="ariaDescribedby" name="cost-sharing" value="No">No</b-form-radio>
            </b-form-radio-group>
          </b-form-group>
          <b-form-group class="multiselect-group">
            <template slot="label">Review Status</template>
            <multiselect v-model="formData.criteria.reviewStatus" :options="reviewStatusOptions" :multiple="true" :limit="1" :limitText="customLimitText" :close-on-select="false" :clear-on-select="false" placeholder="Review Status" :show-labels="false" :searchable="false"></multiselect>
          </b-form-group>
        </form>
      <template #footer>
       <div class="d-flex text-light align-items-center px-3 py-2 sidebar-footer">
        <b-button size="sm" @click="cancel" variant="outline-primary" class="borderless-button">Cancel</b-button>
        <div>
          <b-button size="sm" @click="saveSearch" variant="primary" :disabled="!saveEnabled">Save and View Results</b-button>
        </div>
       </div>
      </template>
      </b-sidebar>
    </div>
  </template>
<script>
import { mapActions, mapGetters } from 'vuex';
import { VBToggle } from 'bootstrap-vue';
import Multiselect from 'vue-multiselect';
import { billOptions } from '@/helpers/constants';

const defaultCriteria = {
  includeKeywords: null,
  excludeKeywords: null,
  opportunityNumber: null,
  opportunityStatuses: [],
  fundingTypes: null,
  agency: null,
  bill: null,
  costSharing: null,
  opportunityCategories: [],
  reviewStatus: [],
  postedWithin: [],
};

export default {
  components: { Multiselect },
  props: {
    SearchType: String,
    showModal: Boolean,
    searchId: Number,
  },
  directives: {
    'v-b-toggle': VBToggle,
  },
  data() {
    return {
      formData: {
        criteria: {
          ...defaultCriteria,
        },
        searchId: this.searchId,
      },
      postedWithinOptions: ['All Time', 'One Week', '30 Days', '60 Days'],
      billOptions,
      opportunityCategoryOptions: ['Discretionary', 'Mandatory', 'Earmark', 'Continuation'],
      reviewStatusOptions: ['Interested', 'Applied', 'Not Applying', 'Assigned'],
      fundingTypeOptions: [
        { code: 'G', name: 'Grant' },
        { code: 'CA', name: 'Cooperative Agreement' },
        { code: 'PC', name: 'Procurement Contract' },
        { code: 'O', name: 'Other' },
      ],
    };
  },
  validations: {
    formData: {},
  },
  watch: {
    displaySearchPanel() {
      if (this.displaySearchPanel) {
        this.initFormState();
        this.showSideBar();
      } else {
        this.$refs.searchPanelSideBar.hide();
      }
    },
    isEditMode() {
      this.initFormState();
    },
  },
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
      eligibilityCodes: 'grants/eligibilityCodes',
      savedSearches: 'grants/savedSearches',
      displaySearchPanel: 'grants/displaySearchPanel',
    }),
    saveEnabled() {
      // save is enabled if any criteria is not null and a title is set
      return Object.values(this.formData.criteria).some((value) => value !== null
      && !(Array.isArray(value) && value.length === 0))
      && this.formData.searchTitle !== null;
    },
    isEditMode() {
      return this.searchId !== null && this.searchId !== undefined && this.searchId !== 0;
    },
    panelTitle() {
      return this.isEditMode ? 'Edit Search' : 'New Search';
    },
  },
  methods: {
    ...mapActions({
      createSavedSearch: 'grants/createSavedSearch',
      updateSavedSearch: 'grants/updateSavedSearch',
      fetchSavedSearches: 'grants/fetchSavedSearches',
      applyFilters: 'grants/applyFilters',
      fetchEligibilityCodes: 'grants/fetchEligibilityCodes',
      changeSelectedSearchId: 'grants/changeSelectedSearchId',
      initNewSearch: 'grants/initNewSearch',
      initViewResults: 'grants/initViewResults',
    }),
    setup() {
      this.fetchEligibilityCodes();
      if (this.displaySearchPanel) {
        this.showSideBar();
      }
    },
    customLimitText(count) {
      return `+${count}`;
    },
    eligibilityLabel({ label }) {
      return label;
    },
    apply() {
      const formDataCopy = { ...this.formData.criteria };
      this.applyFilters(formDataCopy);
      this.initViewResults();
    },
    cancel() {
      // something closed the sidebar outside of the state store actions
      // so we need to reset the state
      if (this.displaySearchPanel) {
        this.initViewResults();
      }
    },
    initFormState() {
      if (this.isEditMode) {
        const search = this.savedSearches.data.find((s) => s.id === this.searchId);
        this.formData.searchId = search.id;
        this.formData.searchTitle = search.name;
        const criteria = JSON.parse(search.criteria);
        this.formData.criteria = { ...criteria };
      } else {
        this.formData.searchId = null;
        this.formData.searchTitle = `My Saved Search ${this.getNextSearchId()}`;
        this.formData.criteria = { ...defaultCriteria };
      }
    },
    onShown() {
      this.initFormState();
    },
    getNextSearchId() {
      const searchIds = this.savedSearches.data.map((s) => s.id);
      return Math.max(...searchIds, 0) + 1;
    },
    async saveSearch() {
      this.apply();
      let searchId;
      try {
        if (this.isEditMode) {
          searchId = this.formData.searchId;
          await this.updateSavedSearch({
            searchId: this.formData.searchId,
            searchInfo: {
              name: this.formData.searchTitle,
              criteria: this.formData.criteria,
            },
          });
          this.$emit('filters-applied');
        } else {
          const res = await this.createSavedSearch({
            searchInfo: {
              name: this.formData.searchTitle,
              criteria: this.formData.criteria,
            },
          });
          searchId = res.id;
        }
        await this.fetchSavedSearches();
        this.changeSelectedSearchId(searchId);
      } catch (e) {
        this.notifyError(e.message);
      }
    },
    notifyError(message) {
      this.$bvToast.toast(message,
        {
          title: 'Error Saving Search',
          variant: 'danger',
          solid: true,
          autoHideDelay: 5000,
          toaster: 'b-toaster-top-left',
        });
    },
    showSideBar() {
      if (!this.$refs.searchPanelSideBar.isOpen) {
        // b-sidebar does not have show() method and v-model does not
        // account for accessibility.
        // See https://bootstrap-vue.org/docs/components/sidebar#v-model
        this.$root.$emit('bv::toggle::collapse', 'search-panel');
      }
    },
  },
};
</script>
<style>
.search-panel-title{
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 120%;
}
.form{
  margin: 10px;
}
.multiselect-title{
  font-weight: 500;
  line-height: 150%;
  margin-left: 2px;
  margin-bottom: 5px;
  color: #1F2123;
}
.multiselect > .multiselect__tags{
  display: flex;
  align-items: center;
}
.multiselect > .multiselect__tags > .multiselect__strong{
  display: inline;
  padding: 4px 5px 4px;
  border-radius: 5px;
  color: #fff;
  line-height: 1;
  background: #41b883;
  margin-bottom: 11px;
}
.b-sidebar-header{
  justify-content: space-between;
  border-bottom: solid #DAE0E5;
  font-size: 1.5rem;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: row;
  flex-grow: 0;
  align-items: center;
}
.search-panel > .b-sidebar > .b-sidebar-header{
  font-size: 1.25rem;
  border-bottom: 1.5px solid #e8e8e8;
  width: 100%;
}
.b-sidebar.b-sidebar-right > .b-sidebar-header .close {
  margin-right: 0;
}
#search-panel___title__{
  margin: 0 auto;
}

.sidebar-footer {
  border-top: 1.5px solid #e8e8e8;
  justify-content: space-between;
  width: 100%;
}
.borderless-button {
  border-color: transparent;
}
.right-button-container{
  width: 190px;
  display: flex;
  justify-content: space-between;
}
.search-form {
  padding: 10px;
}
</style>

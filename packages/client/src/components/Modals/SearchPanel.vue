<template>
    <div class="search-panel">
      <b-button @click="initNewSearch" variant="outline-primary" size="sm">
        New Search
      </b-button>

      <b-form class="search-form" @keyup.enter="onEnter" @submit.prevent="onSubmit" @reset="cancel">
        <b-sidebar
          id="search-panel"
          class="search-side-panel"
          ref="searchPanelSideBar"
          bg-variant="white"
          @shown="onShown"
          @hidden="cancel"
          width="480px"
          backdrop
          right
          shadow
        >
          <template #header>
            <div class="search-panel-title">{{ panelTitle }}</div>
            <b-button-close class="close" type="reset" @click="cancel" />
          </template>
            <b-form-group
              id="search-title-group"
              label="Search Title"
              label-for="search-title"
              description="ex. Infrastructure"
            >
              <b-form-input
                id="search-title"
                type="text"
                v-model="formData.searchTitle"
              />
            </b-form-group>
            <b-form-group
              id="include-input-group"
              label="Include Keywords"
              label-for="include-input"
              description="Separate keywords with comma"
            >
              <b-form-input
                id="include-input"
                type="text"
                v-model="formData.criteria.includeKeywords"
              />
            </b-form-group>
            <b-form-group
              id="exclude-input-group"
              label="Exclude Keywords"
              label-for="exclude-input"
              description="Separate keywords with comma"
            >
              <b-form-input
                id="exclude-input"
                type="text"
                v-model="formData.criteria.excludeKeywords"
              />
            </b-form-group>
            <b-form-group
              id="opportunity-number-input-group"
              label="Opportunity #"
              label-for="opportunity-number-input"
            >
              <b-form-input
                id="opportunity-number-input"
                type="text"
                v-model="formData.criteria.opportunityNumber"
              />
            </b-form-group>
            <b-form-group
              id="opportunity-status-group"
              label="Opportunity Status"
              v-slot="{ ariaDescribedby }"
            >
              <b-form-checkbox-group
                id="opportunity-status"
                v-model="formData.criteria.opportunityStatuses"
                :options="opportunityStatusOptions"
                :aria-describedby="ariaDescribedby"
                inline
              >
              </b-form-checkbox-group>
            </b-form-group>
            <b-form-group
              id="funding-type-group"
              label="Funding Type"
            >
              <multiselect
                id="funding-type"
                v-model="formData.criteria.fundingTypes"
                :options="fundingTypeOptions"
                label="name"
                track-by="code"
                :multiple="true"
                :close-on-select="false"
                :searchable="false"
                selectLabel=""
                :limit="2"
              />
            </b-form-group>
            <b-form-group
              id="eligibility-group"
              label="Eligibility"
              label-for="eligibility"
            >
              <multiselect
                id="eligibility"
                v-model="formData.criteria.eligibility"
                :options="eligibilityCodes"
                label="label"
                track-by="code"
                :multiple="true"
                :close-on-select="false"
                :searchable="true"
                selectLabel=""
                :limit="3"
              />
            </b-form-group>
            <b-form-group
              id="opportunity-category-group"
              label="Category"
            >
              <multiselect
                id="opportunity-category"
                v-model="formData.criteria.opportunityCategories"
                :options="opportunityCategoryOptions"
                :multiple="true"
                :close-on-select="false"
                :searchable="false"
                :limit="2"
                placeholder="Select Opportunity Category"
              />
            </b-form-group>
            <b-form-group
              id="bill-group"
              label="Appropriation Bill"
            >
              <multiselect
                id="bill"
                v-model="formData.criteria.bill"
                :options="billOptions"
                :multiple="false"
                :close-on-select="true"
                :clear-on-select="false"
                :searchable="false"
                placeholder="All Bills"
                :show-labels="false"
              />
            </b-form-group>
            <b-form-group
              id="agency-group"
              label="Agency Code"
              label-for="agency"
            >
              <b-form-input
                id="agency"
                type="text"
                v-model="formData.criteria.agency"
              />
            </b-form-group>
            <b-form-group
              id="posted-within-group"
              label="Posted Within"
            >
              <multiselect
                id="posted-within"
                v-model="formData.criteria.postedWithin"
                :options="postedWithinOptions"
                :multiple="false"
                :close-on-select="true"
                :clear-on-select="false"
                :searchable="false"
                placeholder="All Time"
                :show-labels="false"
              />
            </b-form-group>
            <b-form-group
              id="cost-sharing-group"
              label="Cost Sharing"
              v-slot="{ ariaDescribedby }"
              row
            >
              <b-form-radio-group class="search-fields-radio-group">
                <b-form-radio
                  v-model="formData.criteria.costSharing"
                  :aria-describedby="ariaDescribedby"
                  name="cost-sharing"
                  value="Yes"
                >Yes</b-form-radio>
                <b-form-radio
                  v-model="formData.criteria.costSharing"
                  :aria-describedby="ariaDescribedby"
                  name="cost-sharing"
                  value="No"
                >No</b-form-radio>
              </b-form-radio-group>
            </b-form-group>
          <template #footer>
            <div class="d-flex text-light align-items-center px-3 py-2 sidebar-footer">
              <b-button size="sm" type="reset" variant="outline-primary" class="borderless-button">Cancel</b-button>
              <b-button size="sm" type="submit" variant="primary" :disabled="!saveEnabled">Save and View Results</b-button>
            </div>
          </template>
        </b-sidebar>
      </b-form>
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
      fundingTypeOptions: [
        { code: 'G', name: 'Grant' },
        { code: 'CA', name: 'Cooperative Agreement' },
        { code: 'PC', name: 'Procurement Contract' },
        { code: 'O', name: 'Other' },
      ],
      opportunityStatusOptions: [
        { text: 'Forecasted', value: 'forecasted' },
        { text: 'Posted', value: 'posted' },
        { text: 'Closed', value: 'closed' },
        { text: 'Archived', value: 'archived' },
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
    async onEnter() {
      if (this.saveEnabled) {
        await this.onSubmit();
      }
    },
    async onSubmit() {
      this.apply();
      let searchId;
      try {
        if (this.isEditMode) {
          this.updateSavedSearch({
            searchId: this.formData.searchId,
            searchInfo: {
              name: this.formData.searchTitle,
              criteria: this.formData.criteria,
            },
          });
          searchId = this.formData.searchId;
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
.search-panel .multiselect__option {
  word-break: break-all;
  white-space: normal;
}
.search-panel .sidebar-footer {
  border-top: 1.5px solid #e8e8e8;
  justify-content: space-between;
  width: 100%;
}
.search-panel .borderless-button {
  border-color: transparent;
}
.search-panel .search-panel-title {
  font-style: normal;
  font-weight: 700;
  font-size: 17px;
  line-height: 120%;
}
.search-panel .b-sidebar-header{
  justify-content: space-between;
  border-bottom: solid #DAE0E5;
  font-size: 1.5rem;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: row;
  flex-grow: 0;
  align-items: center;
}
.search-panel .b-sidebar.b-sidebar-right > .b-sidebar-header .close {
  margin-right: 0;
}
.search-panel .b-sidebar-body {
  padding: .75rem;
}
.search-panel .search-fields-radio-group {
  /*
    Ensure radio buttons are hidden behind <multiselect> options
  */
  position: relative;
  z-index: 0;
}
</style>

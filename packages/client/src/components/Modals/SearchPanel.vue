<template>
  <div class="search-panel">
    <b-button
      variant="outline-primary"
      size="sm"
      :disabled="isDisabled"
      @click="initNewSearch"
    >
      New Search
    </b-button>

    <b-form
      class="search-form"
      @keyup.enter="onEnter"
      @submit.prevent="onSubmit"
      @reset="cancel"
    >
      <b-sidebar
        id="search-panel"
        ref="searchPanelSideBar"
        class="search-side-panel"
        bg-variant="white"
        width="480px"
        backdrop
        right
        shadow
        @shown="onShown"
        @hidden="cancel"
      >
        <template #header>
          <div class="search-panel-title">
            {{ panelTitle }}
          </div>
          <b-button-close
            class="close"
            type="reset"
            @click="cancel"
          />
        </template>
        <b-form-group
          id="search-title-group"
          label="Search Title"
          label-for="search-title"
          description="ex. Infrastructure"
          :invalid-feedback="invalidTitleFeedback"
          :state="searchTitleState"
        >
          <b-form-input
            id="search-title"
            v-model="formData.searchTitle"
            type="text"
            aria-describedby="input-live-feedback"
            required
            trim
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
            v-model="formData.criteria.includeKeywords"
            type="text"
            trim
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
            v-model="formData.criteria.excludeKeywords"
            type="text"
            trim
          />
        </b-form-group>
        <b-form-group
          id="opportunity-number-input-group"
          label="Opportunity #"
          label-for="opportunity-number-input"
        >
          <b-form-input
            id="opportunity-number-input"
            v-model="formData.criteria.opportunityNumber"
            type="text"
            trim
          />
        </b-form-group>
        <b-form-group
          id="opportunity-status-group"
          label="Opportunity Status"
        >
          <b-form-checkbox-group
            id="opportunity-status"
            v-model="formData.criteria.opportunityStatuses"
            :options="opportunityStatusOptions"
            inline
          />
        </b-form-group>
        <b-form-group
          id="funding-type-group"
          label="Funding Type"
          label-for="funding-type"
        >
          <v-select
            id="funding-type"
            v-model="formData.criteria.fundingTypes"
            :options="fundingTypeOptions"
            label="name"
            track-by="code"
            :multiple="true"
            :close-on-select="false"
            :searchable="false"
            select-label=""
          />
        </b-form-group>
        <b-form-group
          id="eligibility-group"
          label="Eligibility"
          label-for="eligibility"
        >
          <v-select
            id="eligibility"
            v-model="formData.criteria.eligibility"
            :options="eligibilityCodes"
            label="label"
            track-by="code"
            :multiple="true"
            :close-on-select="false"
            :searchable="true"
            select-label=""
          />
        </b-form-group>
        <b-form-group
          id="opportunity-category-group"
          label="Opportunity Category"
          label-for="opportunity-category"
        >
          <v-select
            id="opportunity-category"
            v-model="formData.criteria.opportunityCategories"
            :options="opportunityCategoryOptions"
            :multiple="true"
            :close-on-select="false"
            :searchable="false"
          />
        </b-form-group>
        <b-form-group
          id="bill-group"
          label="Appropriation Bill"
          label-for="bill"
        >
          <v-select
            id="bill"
            v-model="formData.criteria.bill"
            :options="billOptions"
            :multiple="false"
            :close-on-select="true"
            :clear-on-select="false"
            :searchable="false"
            placeholder="All Bills"
            :show-labels="false"
            :clearable="false"
          />
        </b-form-group>
        <b-form-group
          id="category-of-funding-activity-group"
          label="Category of Funding Activity"
          label-for="category-of-funding-activity"
        >
          <v-select
            id="category-of-funding-activity"
            v-model="formData.criteria.fundingActivityCategories"
            :options="fundingActivityCategories"
            :multiple="true"
            :close-on-select="false"
            label="name"
          />
        </b-form-group>
        <b-form-group
          id="agency-group"
          label="Agency Code"
          label-for="agency"
        >
          <b-form-input
            id="agency"
            v-model="formData.criteria.agency"
            type="text"
            trim
          />
        </b-form-group>
        <b-form-group
          id="posted-within-group"
          label="Posted Within"
          label-for="posted-within"
        >
          <v-select
            id="posted-within"
            v-model="formData.criteria.postedWithin"
            :options="postedWithinOptions"
            :multiple="false"
            :close-on-select="true"
            :clear-on-select="false"
            :searchable="false"
            placeholder="All Time"
            :show-labels="false"
            :clearable="false"
          />
        </b-form-group>
        <b-form-group
          id="cost-sharing-group"
          label="Cost Sharing"
          row
        >
          <b-form-radio-group class="search-fields-radio-group">
            <b-form-radio
              v-model="formData.criteria.costSharing"
              name="cost-sharing"
              value="Yes"
            >
              Yes
            </b-form-radio>
            <b-form-radio
              v-model="formData.criteria.costSharing"
              name="cost-sharing"
              value="No"
            >
              No
            </b-form-radio>
          </b-form-radio-group>
        </b-form-group>
        <template #footer>
          <div class="d-flex text-light align-items-center px-3 py-2 sidebar-footer">
            <b-button
              size="sm"
              type="reset"
              variant="outline-primary"
              class="borderless-button"
            >
              Cancel
            </b-button>
            <b-button
              size="sm"
              type="submit"
              variant="primary"
              :disabled="!saveEnabled"
            >
              Save and View Results
            </b-button>
          </div>
        </template>
      </b-sidebar>
    </b-form>
  </div>
</template>
<script>

import { mapActions, mapGetters } from 'vuex';
import { VBToggle } from 'bootstrap-vue';
import { DateTime } from 'luxon';
import { billOptions } from '@/helpers/constants';

const defaultCriteria = {
  includeKeywords: null,
  excludeKeywords: null,
  opportunityNumber: null,
  opportunityStatuses: ['posted'],
  fundingTypes: null,
  agency: null,
  bill: null,
  costSharing: null,
  opportunityCategories: [],
  fundingActivityCategories: [],
  postedWithin: [],
};

export default {
  directives: {
    'v-b-toggle': VBToggle,
  },
  props: {
    showModal: Boolean,
    searchId: {
      type: Number,
      default: null,
    },
    isDisabled: Boolean,
  },
  data() {
    return {
      formData: {
        criteria: {
          ...defaultCriteria,
        },
        searchTitle: null,
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
        { text: 'Posted', value: 'posted' },
        // b-form-checkbox-group doesn't handle multiple values well 'archived' is added
        // whenever 'closed' is checked, but as post processing step. See apply()
        { text: 'Closed / Archived', value: 'closed' },
      ],
    };
  },
  computed: {
    ...mapGetters({
      eligibilityCodes: 'grants/eligibilityCodes',
      fundingActivityCategories: 'grants/fundingActivityCategories',
      savedSearches: 'grants/savedSearches',
      displaySearchPanel: 'grants/displaySearchPanel',
    }),
    isEditMode() {
      return this.searchId !== null && this.searchId !== undefined && this.searchId !== 0;
    },
    saveEnabled() {
      return this.searchTitleIsValid() && this.formIsDirty();
    },
    panelTitle() {
      return this.isEditMode ? 'Edit Search' : 'New Search';
    },
    searchTitleState() {
      return this.searchTitleIsValid();
    },
    invalidTitleFeedback() {
      return 'Search Title is required';
    },
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
  methods: {
    ...mapActions({
      createSavedSearch: 'grants/createSavedSearch',
      updateSavedSearch: 'grants/updateSavedSearch',
      fetchSavedSearches: 'grants/fetchSavedSearches',
      applyFilters: 'grants/applyFilters',
      fetchSearchConfig: 'grants/fetchSearchConfig',
      changeSelectedSearchId: 'grants/changeSelectedSearchId',
      initNewSearch: 'grants/initNewSearch',
      initViewResults: 'grants/initViewResults',
    }),
    setup() {
      this.fetchSearchConfig();
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
    searchTitleIsValid() {
      return !!this.formData.searchTitle;
    },
    formIsDirty() {
      return !(JSON.stringify(this.formData.criteria) === JSON.stringify(defaultCriteria));
    },
    apply() {
      const formDataCopy = { ...this.formData.criteria };
      // b-form-checkbox-group doesn't handle multiple values well. To include 'achived' whenever
      // we click 'closed', we add 'archived' when it comes off of the form. See also initFormState()
      if (formDataCopy?.opportunityStatuses.find((e) => e === 'closed')) {
        formDataCopy.opportunityStatuses.push('archived');
      }
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
        // b-form-checkbox-group doesn't handle multiple values well. 'archive' will be stored
        // when we display 'closed' as checked. We remove it here for consistency. See also apply()
        criteria.opportunityStatuses = criteria.opportunityStatuses.filter((item) => item !== 'archived');
        this.formData.criteria = { ...criteria };
      } else {
        this.formData.searchId = null;
        const now = DateTime.now();
        this.formData.searchTitle = `${now.toLocaleString(DateTime.DATE_SHORT)} - ${now.toLocaleString(DateTime.TIME_WITH_SECONDS)}`;
        this.formData.criteria = { ...defaultCriteria };
      }
    },
    onShown() {
      this.initFormState();
    },
    async onEnter(event) {
      const enterInOpenDropdown = event.target.closest('.vs--open');
      if (this.saveEnabled && !enterInOpenDropdown) {
        await this.onSubmit();
      }
    },
    async onSubmit() {
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
        await this.fetchSavedSearches({
          perPage: 10,
          currentPage: 1,
        });
        this.changeSelectedSearchId(searchId);
      } catch (e) {
        this.notifyError(e.message);
      }
    },
    notifyError(message) {
      this.$bvToast.toast(
        message,
        {
          title: 'Error Saving Search',
          variant: 'danger',
          solid: true,
          autoHideDelay: 5000,
          toaster: 'b-toaster-top-left',
        },
      );
    },
    showSideBar() {
      if (!this.$refs.searchPanelSideBar?.isOpen) {
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
</style>

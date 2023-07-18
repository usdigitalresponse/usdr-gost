<template>
    <div>
      <b-button v-b-toggle.search-panel variant="outline-secondary">
          <b-icon icon="sliders" class="mr-1 mb-1" font-scale="0.9" aria-hidden="true" />
          Search
        </b-button>
      <b-sidebar
        id="search-panel"
        ref="searchPanelSideBar"
        title="Search"
        class="search-panel"
        right
        shadow
      >
        <form ref="form" class="search-form">
          <b-form-group label-for="include-input">
            <template slot="label">Include Keywords</template>
              <b-form-input
                id="include-input"
                type="text"
                v-model="formData.includeInput"
              ></b-form-input>
          </b-form-group>
          <b-form-group label-for="exclude-input">
            <template slot="label">Exclude Keywords</template>
              <b-form-input
                id="exclude-input"
                type="text"
                v-model="formData.excludeInput"
              ></b-form-input>
          </b-form-group>
          <b-form-group label-for="opportunity-number">
            <template slot="label">Opportunity #</template>
              <b-form-input
                id="opportunity-number-input"
                type="number"
                v-model="formData.opportunityNumber"
              ></b-form-input>
          </b-form-group>
          <b-form-group label="Opportunity Status" v-slot="{ ariaDescribedby }">
            <b-form-checkbox-group
              id="opportunity-status"
              v-model="formData.opportunityStatusFilters"
              :aria-describedby="ariaDescribedby"
              name="opportunity-status"
              inline
            >
              <b-form-checkbox value="forecasted">Forecasted</b-form-checkbox>
              <b-form-checkbox value="posted">Posted</b-form-checkbox>
              <b-form-checkbox value="closed">Closed</b-form-checkbox>
            </b-form-checkbox-group>
          </b-form-group>
          <b-form-group class="multiselect-group">
            <template slot="label">Eligibility</template>
            <multiselect v-model="formData.opportunityCategoryFilters" :options="eligibilityCodes" :custom-label="eligibilityLabel" :multiple="true" :limit="1" :limitText="customLimitText" :close-on-select="false" :clear-on-select="false" placeholder="Eligibility" :show-labels="false" :searchable="false"></multiselect>
          </b-form-group>
          <b-form-group class="multiselect-group">
            <template slot="label">Category</template>
            <multiselect v-model="formData.opportunityCategoryFilters" :options="opportunityCategoryOptions" :multiple="true" :limit="1" :limitText="customLimitText" :close-on-select="false" :clear-on-select="false" placeholder="Opportunity Category" :show-labels="false" :searchable="false"></multiselect>
          </b-form-group>
          <b-form-group label-for="Funding Type">
            <template slot="label">Funding Type</template>
              <b-form-input
                id="funding-type"
                type="text"
                v-model="formData.fundingType"
              ></b-form-input>
          </b-form-group>
          <b-form-group label-for="Agency">
            <template slot="label">Agency</template>
              <b-form-input
                id="agency"
                type="text"
                v-model="formData.agency"
              ></b-form-input>
          </b-form-group>
          <b-form-group>
            <template slot="label">Posted Within</template>
            <multiselect v-model="formData.postedWithinFilters" :options="postedWithinOptions" :multiple="false"
                     :close-on-select="true" :clear-on-select="false" placeholder="All Time" :show-labels="false">
            </multiselect>
          </b-form-group>
          <b-form-group label="Cost Sharing" v-slot="{ ariaDescribedby }" row>
            <b-form-radio-group>
              <b-form-radio v-model="formData.costSharing" :aria-describedby="ariaDescribedby" name="cost-sharing" value="A">Yes</b-form-radio>
              <b-form-radio v-model="formData.costSharing" :aria-describedby="ariaDescribedby" name="cost-sharing" value="B">No</b-form-radio>
            </b-form-radio-group>
          </b-form-group>
          <b-form-group class="multiselect-group">
            <template slot="label">Review Status</template>
            <multiselect v-model="formData.reviewStatusFilters" :options="reviewStatusOptions" :multiple="true" :limit="1" :limitText="customLimitText" :close-on-select="false" :clear-on-select="false" placeholder="Review Status" :show-labels="false" :searchable="false"></multiselect>
          </b-form-group>
        </form>
      <template #footer="{ hide }">
       <div class="d-flex text-light align-items-center px-3 py-2 sidebar-footer">
        <b-button size="sm" @click="hide" variant="outline-primary" class="borderless-button">Close</b-button>
        <div class="right-button-container">
          <b-button size="sm" @click="hide" variant="outline-primary">Save New Search</b-button>
          <b-button size="sm" @click="hide" variant="primary">Apply</b-button>
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

export default {
  components: { Multiselect },
  props: {
    SearchType: String,
    showModal: Boolean,
  },
  directives: {
    'v-b-toggle': VBToggle,
  },
  data() {
    return {
      formData: {
        includeInput: null,
        excludeInput: null,
        opportunityNumber: null,
        opportunityStatusFilters: [],
        fundingType: null,
        agency: null,
        costSharing: false,
        opportunityCategoryFilters: [],
        reviewStatusFilters: [],
        postedWithinFilters: [],
      },
      postedWithinOptions: ['All Time', 'One Week', '30 Days', '60 Days'],
      opportunityCategoryOptions: ['Discretionary', 'Mandatory', 'Earmark', 'Continuation'],
      reviewStatusOptions: ['interested', 'result', 'rejected'],
    };
  },
  validations: {
    formData: {},
  },
  watch: {},
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
      eligibilityCodes: 'grants/eligibilityCodes',
    }),
  },
  methods: {
    ...mapActions({}),
    setup() {
      this.fetchEligibilityCodes();
    },
    customLimitText(count) {
      return `+${count}`;
    },
    eligibilityLabel({ label }) {
      return label;
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

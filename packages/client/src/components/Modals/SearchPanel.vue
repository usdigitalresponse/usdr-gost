<template>
    <div>
      <b-button v-b-toggle.search-panel variant="outline-secondary">
          <b-icon icon="sliders" class="mr-1 mb-1" font-scale="0.9" aria-hidden="true" />
          Search
        </b-button>
      <b-sidebar
        id="search-panel"
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
          <b-form-group label-for="oportunity-number">
            <template slot="label">Oportunity #</template>
              <b-form-input
                id="oportunity-number-input"
                type="number"
                v-model="formData.oportunityNumber"
              ></b-form-input>
          </b-form-group>
          <b-form-group label="Oportunity Status" v-slot="{ ariaDescribedby }">
            <b-form-checkbox-group
              id="oportunity-status"
              v-model="formData.oportunityStatus"
              :aria-describedby="ariaDescribedby"
              name="oportunity-status"
              inline
            >
              <b-form-checkbox value="forecasted">Forecasted</b-form-checkbox>
              <b-form-checkbox value="posted">Posted</b-form-checkbox>
              <b-form-checkbox value="closed">Closed</b-form-checkbox>
            </b-form-checkbox-group>
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
          <b-form-group label="Cost Sharing" v-slot="{ ariaDescribedby }">
            <b-form-radio v-model="formData.costSharing" :aria-describedby="ariaDescribedby" name="cost-sharing" value="A">Yes</b-form-radio>
            <b-form-radio v-model="formData.costSharing" :aria-describedby="ariaDescribedby" name="cost-sharing" value="B">No</b-form-radio>
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

export default {
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
        oportunityNumber: null,
        oportunityStatus: [],
        fundingType: null,
        agency: null,
        costSharing: false,
      },
    };
  },
  validations: {
    formData: {},
  },
  watch: {},
  computed: {
    ...mapGetters({}),
  },
  mounted() {
  },
  methods: {
    ...mapActions({}),
  },
};
</script>
<style>
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

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
      <b-form-group class="form">
        <div class="multiselect-group">
          <div class="multiselect-title">Category</div>
          <multiselect v-model="opportunityCategoryFilters" :options="opportunityCategoryOptions" :multiple="true" :limit="1" :limitText="customLimitText" :close-on-select="false" :clear-on-select="false" placeholder="Opportunity Category" :show-labels="false" :searchable="false"></multiselect>
        </div>
      </b-form-group>
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
      formData: {},
      opportunityCategoryFilters: [],
      opportunityCategoryOptions: ['Discretionary', 'Mandatory', 'Earmark', 'Continuation'],
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
    customLimitText(count) {
      return `+${count}`;
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
</style>

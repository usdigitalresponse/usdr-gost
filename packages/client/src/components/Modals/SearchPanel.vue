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
              required
            ></b-form-input>
        </b-form-group>
        <b-form-group label-for="exclude-input">
          <template slot="label">Exclude Keywords</template>
            <b-form-input
              id="exclude-input"
              type="text"
              v-model="formData.excludeInput"
              required
            ></b-form-input>
        </b-form-group>
        <b-form-group label-for="oportunity-number">
          <template slot="label">Oportunity #</template>
            <b-form-input
              id="oportunity-number-input"
              type="number"
              v-model="formData.oportunityNumber"
              required
            ></b-form-input>
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

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
        shadow
      >
      <b-form-group></b-form-group>
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
      formData: {},
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
}
</style>

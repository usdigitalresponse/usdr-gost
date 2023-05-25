<template>
    <div>
      <b-button v-b-toggle.search-panel variant="outline-secondary">
          <b-icon icon="search" class="mr-1 mb-1" font-scale="0.9" aria-hidden="true" />
          Search
        </b-button>
      <b-sidebar
        id="search-panel"
        title="Search"
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

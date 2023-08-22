<template>
  <div class="filter-container d-flex">
    <div class="align-self-end">
      <div class="align-self-end">
        <h4 class="mb-0">{{ selectedSearch === null ? "All Grants" : searchName }} </h4>
        <span v-if="selectedSearch !== null">
          <a href="#" v-on:click.prevent="editFilter">Edit</a> | <a href="#" v-on:click.prevent="clearAll" v-if="$props.filterKeys.length > 0">Clear</a>
        </span>
      </div>
      <span class="filter-item" v-for="(item, idx) in $props.filterKeys" :key="idx">
        {{ item.label }}: <strong >{{ formatValue(item.value)}}</strong><span v-if="idx != $props.filterKeys.length - 1">;</span>
      </span>
    </div>
  </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  props: {
    filterKeys: {
      type: Array,
      required: true,
      validator: (value) => value.every((item) => typeof item.label === 'string'),
    },
  },
  methods: {
    ...mapActions({
      removeFilter: 'grants/removeFilter',
      clearSelectedSearch: 'grants/clearSelectedSearch',
      fetchEligibilityCodes: 'grants/fetchEligibilityCodes',
      initEditSearch: 'grants/initEditSearch',
    }),
    formatValue(value) {
      if (Array.isArray(value)) {
        return value.map((item) => this.formatValue(item)).join(', ');
      }
      if (value !== null && value.label) {
        return value.label;
      }
      return value;
    },
    editFilter() {
      this.initEditSearch(this.selectedSearch.id);
    },
    clearAll() {
      this.clearSelectedSearch();
      this.$emit('filter-removed');
    },
  },
  computed: {
    ...mapGetters({
      selectedSearch: 'grants/selectedSearch',
    }),
    searchName() {
      const search = this.selectedSearch;
      if (!search) {
        return 'OPE';
      }
      return this.selectedSearch.name;
    },
  },
};

</script>

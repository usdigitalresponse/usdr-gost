<template>
  <div class="filter-container">
    <div class="mb-3">
      <div class="ml-2" v-if="selectedSearch !== null">
        <b>{{ searchName }} </b>
        <a href="#" v-on:click="editFilter">Edit</a> | <a href="#" v-on:click="clearAll" v-if="$props.filterKeys.length > 0">Clear</a>
      </div>
      <div class="ml-2" v-if="selectedSearch === null">
        <b>All Grants</b>
      </div>
      <span class="filter-item" v-for="(item, idx) in $props.filterKeys" :key="idx">
        <strong >{{ item.label }}: </strong>{{ formatValue(item.value)  }}
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
      this.$emit('edit-filter');
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
<style>
.filter-item {
  padding: 0.25rem 0.5rem;
}
.filter-container {
  height: 65px;
}
</style>

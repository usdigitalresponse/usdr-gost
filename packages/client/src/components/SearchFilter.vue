<template>
  <div class="filter-container">
    <div class="mb-3">
      <div class="ml-2">
        <b>Saved Search Name </b>
        <a href="#" v-on:click="clearAll">Edit</a> | <a href="#" v-on:click="clearAll" v-if="$props.filterKeys.length > 0">Clear</a>
      </div>
      <span class="filter-item" v-for="(item, idx) in $props.filterKeys" :key="idx">
        <strong >{{ item.label }}: </strong>{{ formatValue(item.value)  }}
      </span>
    </div>
  </div>
</template>
<script>
import { mapActions } from 'vuex';

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
      clearFilters: 'grants/clearFilters',
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
    clearAll() {
      this.clearFilters();
      this.$emit('filter-removed');
    },
    clearFilter(key) {
      this.removeFilter(key);
      this.$emit('filter-removed', key);
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

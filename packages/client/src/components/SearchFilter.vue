<template>
  <div>
    <div class="mb-3">
      <div class="ml-2">
        <b>Saved Search Name </b>
        <a href="#" v-on:click="clearAll">Edit</a> | <a href="#" v-on:click="clearAll">Clear</a>
      </div>
      <span class="filter-item" v-for="(item, idx) in $props.filterKeys" :key="idx">
        <strong >{{ item.label }}: </strong>{{ formatValue(item.value)  }}
      </span>
    </div>
  </div>
</template>
<script>

export default {
  props: {
    filterKeys: {
      type: Array,
      required: true,
      validator: (value) => value.every((item) => typeof item.label === 'string'),
    },
  },
  methods: {
    formatValue(value) {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value;
    },
    clearAll() {
      this.filterKeys.splice(0, this.filterKeys.length);
    },
    clearFilter(index) {
      // TODO emit event when parent component is handling state
      // this.$emit('filter:remove', index);
      this.filterKeys.splice(index, 1);
    },
  },
};

</script>
<style>
.filter-item {
  padding: 0.25rem 0.5rem;
}

</style>

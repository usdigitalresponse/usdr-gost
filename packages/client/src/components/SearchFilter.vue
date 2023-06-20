<template>
  <div>
    <span class="filter-item" v-for="(item, idx) in Object.entries($props.filterKeys)" :key="idx">
      <strong >{{ item[0] }}: </strong>{{ formatValue(item[1])  }} <b-icon icon="x">&nbsp;</b-icon>
    </span>
    <div>
      <a href="#" v-on:click="clear">Clear all</a>
    </div>
  </div>
</template>
<script>

export default {
  props: {
    filterKeys: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
    };
  },
  methods: {
    formatValue(value) {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value;
    },
    clear() {
    },
  },
};

</script>
<style>
.filter-item {
  padding: 0.25rem 0.5rem;
}

</style>

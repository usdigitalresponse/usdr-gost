<template>
  <component :is="tableComponent" :hideGrantItems="true"/>
</template>

<script>

import GrantsTable from '@/components/GrantsTable.vue';

export default {
  data() {
    return {

    };
  },
  methods: {},
  computed: {
    tableComponent() {
      return GrantsTable;
    },
  },
};
</script>

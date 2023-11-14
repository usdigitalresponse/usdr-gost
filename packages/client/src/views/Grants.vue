<template>
  <component :is="tableComponent" :hideGrantItems="true"/>
</template>

<script>

import GrantsTableNext from '@/components/GrantsTableNext.vue';

export default {
  data() {
    return {

    };
  },
  methods: {},
  computed: {
    tableComponent() {
      return GrantsTableNext;
    },
  },
};
</script>

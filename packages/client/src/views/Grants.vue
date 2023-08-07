<template>
  <component :is="tableComponent" :hideGrantItems="true"/>
</template>

<script>

import GrantsTable from '@/components/GrantsTable.vue';
import GrantsTableNext from '@/components/GrantsTableNext.vue';
import { useNewGrantsTable } from '@/helpers/featureFlags';

export default {
  components: { GrantsTable },
  data() {
    return {

    };
  },
  methods: {},
  computed: {
    tableComponent() {
      return useNewGrantsTable() ? GrantsTableNext : GrantsTable;
    },
  },
};
</script>

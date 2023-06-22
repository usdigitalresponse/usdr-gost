<template>
  <component :is="tableComponent" :hideGrantItems="true"/>
</template>

<script>

import GrantsTable from '@/components/GrantsTable.vue';
import GrantsTableNext from '@/components/GrantsTableNext.vue';

export default {
  components: { GrantsTable },
  data() {
    return {

    };
  },
  methods: {},
  computed: {
    tableComponent() {
      const useNewTable = process.env.NODE_ENV === 'development' || process.env.VUE_APP_USE_NEW_TABLE === 'true';
      return useNewTable ? GrantsTableNext : GrantsTable;
    },
  },
};
</script>

<template>
  <b-tabs pills align="center" lazy>
    <b-tab title="Interested" active>
      <component :is="tableComponent" :showInterested="true"/>
    </b-tab>
    <b-tab title="Assigned">
      <component :is="tableComponent" :showAssignedToAgency="selectedAgencyId"/>
    </b-tab>
    <b-tab title="Not Applying">
      <component :is="tableComponent" :showRejected="true"/>
    </b-tab>
    <b-tab title="Applied">
        <component :is="tableComponent" :showResult="true"/>
    </b-tab>
  </b-tabs>
</template>

<script>
import { mapGetters } from 'vuex';

import GrantsTable from '@/components/GrantsTable.vue';
import GrantsTableNext from '@/components/GrantsTableNext.vue';

export default {
  components: { GrantsTable },
  data() {
    return {

    };
  },
  computed: {
    ...mapGetters({
      selectedAgencyId: 'users/selectedAgencyId',
    }),
    tableComponent() {
      const useNewTable = process.env.NODE_ENV === 'development' || process.env.VUE_APP_USE_NEW_TABLE === 'true';
      return useNewTable ? GrantsTableNext : GrantsTable;
    },
  },
  methods: {},
};
</script>

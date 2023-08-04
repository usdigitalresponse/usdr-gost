<template>
  <b-tabs pills align="center" lazy>
    <b-tab title="Interested" active>
      <component :is="tableComponent" :showInterested="true" :showSearchControls="false"/>
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
import { useNewGrantsTable } from '@/helpers/featureFlags';

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
      return useNewGrantsTable() ? GrantsTableNext : GrantsTable;
    },
  },
  methods: {},
};
</script>

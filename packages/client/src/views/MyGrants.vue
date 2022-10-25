<template>
  <b-tabs pills align="center" lazy>
    <b-tab title="Interested" active>
      <GrantsTable :showInterested="true"/>
    </b-tab>
    <b-tab title="Assigned">
      <GrantsTable :showAssignedToAgency="selectedAgencyId"/>
    </b-tab>
    <b-tab title="Rejected">
      <GrantsTable :showRejected="true"/>
    </b-tab>
  </b-tabs>
</template>

<script>
import { mapGetters } from 'vuex';

import GrantsTable from '@/components/GrantsTable.vue';

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
  },
  methods: {},
};
</script>

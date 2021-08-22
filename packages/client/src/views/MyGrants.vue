<template>
  <b-tabs pills align="center" lazy>
    <b-tab title="Interested" active>
      <GrantsTable :showInterested="true"/>
    </b-tab>
    <b-tab title="Assigned">
      <GrantsTable :showAssignedToAgency="loggedInUser.agency.id"/>
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
      loggedInUser: 'users/loggedInUser',
    }),
  },
  methods: {},
};
</script>

<template>
  <div class="grants-tabs">
    <b-tabs align="left" style="margin-top: 1.5rem" lazy>
      <b-tab title="Interested" active>
        <component :is="tableComponent" searchTitle="Interested" :showInterested="true" :showSearchControls="false"/>
      </b-tab>
      <b-tab title="Assigned">
        <component :is="tableComponent" searchTitle="Assigned" :showAssignedToAgency="selectedAgencyId" :showSearchControls="false"/>
      </b-tab>
      <b-tab title="Not Applying">
        <component :is="tableComponent" searchTitle="Not Applying" :showRejected="true" :showSearchControls="false"/>
      </b-tab>
      <b-tab title="Applied">
          <component :is="tableComponent" searchTitle="Applied" :showResult="true" :showSearchControls="false"/>
      </b-tab>
    </b-tabs>
  </div>
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
<style>
.grants-tabs .nav-tabs {
  padding-left: 20px;
  border-bottom: none;
  margin-bottom: 20px;
}

.grants-tabs .nav-tabs .nav-link:hover {
  border-color: transparent;
  text-decoration: underline;
}
.grants-tabs .nav-link.active,.grants-tabs .nav-link.active:hover {
  /* border: 0px;
  border-bottom: 1px; */
  isolation: isolate;
  border-color: transparent transparent #dee2e6;
  text-decoration: none;
}
</style>

<template>
  <div class="grants-tabs">
    <b-tabs align="left" style="margin-top: 1.5rem" lazy v-model="activeTab">
      <b-tab title="Interested">
        <GrantsTable searchTitle="Interested" showInterested :showSearchControls="false"/>
      </b-tab>
      <b-tab title="Assigned">
        <GrantsTable searchTitle="Assigned" :showAssignedToAgency="selectedAgencyId" :showSearchControls="false"/>
      </b-tab>
      <b-tab title="Not Applying">
        <GrantsTable searchTitle="Not Applying" showRejected :showSearchControls="false"/>
      </b-tab>
      <b-tab title="Applied">
        <GrantsTable searchTitle="Applied" showResult :showSearchControls="false"/>
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import GrantsTable from '@/components/GrantsTable.vue';

export default {
  components: {
    GrantsTable,
  },
  data() {
    return {
      activeTab: 0,
    };
  },
  created() {
    this.$watch('$route.params.tab', (tabName) => {
      this.activeTab = this.$route.meta.tabNames.indexOf(tabName);
    }, { immediate: true });
    this.$watch('activeTab', (newActiveTab) => {
      this.$router.push({ name: 'myGrants', params: { tab: this.$route.meta.tabNames[newActiveTab] } });
    });
  },
  computed: {
    ...mapGetters({
      selectedAgencyId: 'users/selectedAgencyId',
    }),
  },
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

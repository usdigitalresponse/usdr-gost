<template>
  <div class="grants-tabs">
    <b-tabs
      :key="activeTab /* Force reload when tab changes to hacky fix a visual artifact, see: https://github.com/usdigitalresponse/usdr-gost/issues/2721 */"
      v-model="activeTab"
      align="left"
      style="margin-top: 1.5rem"
      lazy
    >
      <b-tab :title="sharedTabTitle">
        <GrantsTable
          :search-title="sharedTabTitle"
          :show-assigned-to-agency="selectedAgencyId"
          :show-search-controls="false"
        />
      </b-tab>
      <b-tab
        v-if="!followNotesEnabled"
        title="Interested"
      >
        <GrantsTable
          search-title="Interested"
          show-interested
          :show-search-controls="false"
        />
      </b-tab>
      <b-tab
        v-if="!followNotesEnabled"
        title="Not Applying"
      >
        <GrantsTable
          search-title="Not Applying"
          show-rejected
          :show-search-controls="false"
        />
      </b-tab>
      <b-tab
        v-if="!followNotesEnabled"
        title="Applied"
      >
        <GrantsTable
          search-title="Applied"
          show-result
          :show-search-controls="false"
        />
      </b-tab>
      <b-tab
        v-if="followNotesEnabled"
        title="Followed by My Team"
      >
        <GrantsTable
          search-title="Followed by My Team"
          :show-followed-by-agency="selectedAgencyId"
          :show-search-controls="false"
        />
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import GrantsTable from '@/components/GrantsTable.vue';
import { shareTerminologyEnabled, followNotesEnabled } from '@/helpers/featureFlags';

export default {
  components: {
    GrantsTable,
  },
  data() {
    return {
      activeTab: 0,
    };
  },
  computed: {
    ...mapGetters({
      selectedAgencyId: 'users/selectedAgencyId',
    }),
    shareTerminologyEnabled() {
      return shareTerminologyEnabled();
    },
    followNotesEnabled() {
      return followNotesEnabled();
    },
    sharedTabTitle() {
      if (followNotesEnabled()) {
        return 'Shared With My Team';
      } if (shareTerminologyEnabled()) {
        return 'Shared With Your Team';
      }
      return 'Assigned';
    },
  },
  created() {
    this.$watch('$route.params.tab', (tabName) => {
      this.activeTab = this.$route.meta.tabNames.indexOf(tabName);
    }, { immediate: true });
    this.$watch('activeTab', (newActiveTab) => {
      this.$router.push({ name: 'myGrants', params: { tab: this.$route.meta.tabNames[newActiveTab] } });
    });
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

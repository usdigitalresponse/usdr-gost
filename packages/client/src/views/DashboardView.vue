<!-- eslint-disable max-len -->
<template>
  <section class="m-3">
    <div class="px-5">
      <b-container fluid>
        <div class="row">
          <b-col>
            <b-card>
              <div class="card-block text-left">
                <h4 class="card-title gutter-title1 row">
                  Recent Activity
                </h4>
                <span
                  v-if="!grantsInterested?.length"
                  id="noRecentActivityMessage"
                  class="gutter-title1 row"
                >Your {{ newTerminologyEnabled ? 'team' : 'agency' }} has no recent activity.</span>
              </div>
              <ActivityTable
                :grants-interested="grantsInterested"
                :on-row-clicked="onRowClicked"
                :on-row-selected="onRowSelected"
              />
              <div v-if="totalInterestedGrants > 4">
                <b-row align-v="center">
                  <b-navbar
                    toggleable="sm py-0"
                    bg-transparent
                    class="gutter-activity row"
                  >
                    <b-link
                      class="nav-link active"
                      to="RecentActivity"
                    >
                      See All Activity
                    </b-link>
                  </b-navbar>
                </b-row>
              </div>
            </b-card>
          </b-col>
          <b-col cols="1" />
        </div>
      </b-container>
    </div>
    <br>

    <GrantDetailsLegacy
      v-if="!newGrantsDetailPageEnabled"
      :selected-grant.sync="selectedGrant"
    />
  </section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import resizableTableMixin from '@/mixin/resizableTable';
import GrantDetailsLegacy from '@/components/Modals/GrantDetailsLegacy.vue';
import ActivityTable from '@/components/ActivityTable.vue';
import { newTerminologyEnabled, newGrantsDetailPageEnabled } from '@/helpers/featureFlags';

export default {
  components: { ActivityTable, GrantDetailsLegacy },
  mixins: [resizableTableMixin],
  data() {
    return {
      perPage: 4,
      perPageClosest: 3,
      currentPage: 1,
      selectedGrant: null,
    };
  },
  computed: {
    ...mapGetters({
      totalInterestedGrants: 'grants/totalInterestedGrants',
      selectedTeam: 'users/selectedAgency',
      grantsInterested: 'grants/grantsInterested',
      currentGrant: 'grants/currentGrant',
    }),
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
    newGrantsDetailPageEnabled() {
      return newGrantsDetailPageEnabled();
    },
  },
  watch: {
    async selectedTeam() {
      await this.setup();
    },
    async selectedGrant() {
      if (!this.selectedGrant) {
        await this.fetchGrantsInterested();
      }
    },
    currentGrant() {
      if (this.selectedGrant && this.currentGrant) {
        this.onRowSelected([this.currentGrant]);
      }
    },
  },
  async mounted() {
    await this.setup();
  },
  methods: {
    ...mapActions({
      fetchGrantsInterested: 'grants/fetchGrantsInterested',
      fetchGrantDetails: 'grants/fetchGrantDetails',
    }),
    async setup() {
      this.fetchGrantsInterested({ perPage: this.perPage, currentPage: this.currentPage });
    },
    async onRowSelected(items) {
      const [row] = items;
      if (row) {
        await this.fetchGrantDetails({ grantId: row.grant_id }).then(() => {
          this.selectedGrant = this.currentGrant;
        });
      }
    },
    onRowClicked(item) {
      if (!newGrantsDetailPageEnabled()) {
        return;
      }
      this.$router.push({ name: 'grantDetail', params: { id: item.grant_id } });
    },
  },
};
</script>

<style scoped>
  .gutter-activity.row {
    margin-left: -10px;
    margin-top: -8px;
    margin-bottom: -6px;
  }
  .gutter-title1.row {
    margin-left: +4px;
  }
  .gutter-title2.row {
    margin-left: +10px;
  }
</style>

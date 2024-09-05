<!-- eslint-disable max-len -->
<template>
  <b-card>
    <!-- Assign grant section -->
    <div class="mb-5">
      <h3 class="mb-3">
        {{ shareTerminologyEnabled ? 'Share Grant' : 'Assign Grant' }}
      </h3>
      <div class="d-flex print-d-none">
        <v-select
          v-model="selectedAgencyToAssign"
          class="flex-grow-1 mr-3"
          :options="unassignedAgencies"
          label="name"
          track-by="id"
          :placeholder="`Choose ${newTerminologyEnabled ? 'team': 'agency'}`"
          :clearable="false"
          data-dd-action-name="select team for grant assignment"
          @close="$refs.assignSubmitButton.focus()"
        />
        <b-button
          ref="assignSubmitButton"
          variant="outline-primary"
          :disabled="!selectedAgencyToAssign"
          data-dd-action-name="assign team"
          @click="assignAgencyToGrant(selectedAgencyToAssign)"
        >
          {{ shareTerminologyEnabled ? 'Share' : 'Submit' }}
        </b-button>
      </div>
      <template v-if="!shareTerminologyEnabled">
        <div
          v-for="agency in assignedAgencies"
          :key="agency.id"
          class="d-flex justify-content-between align-items-start my-4"
        >
          <div class="mr-3">
            <p class="m-0">
              {{ agency.name }}
            </p>
            <p class="m-0 text-muted">
              <small>{{ formatDateTime(agency.created_at) }}</small>
            </p>
          </div>
          <b-button-close
            data-dd-action-name="remove team assignment"
            class="print-d-none"
            @click="unassignAgencyToGrant(agency)"
          />
        </div>
      </template>
      <template v-else>
        <div
          v-for="agency in assignedAgencies"
          :key="agency.id"
          class="d-flex justify-content-start align-items-start my-3"
        >
          <UserAvatar
            :user-name="agency.assigned_by_name"
            :color="agency.assigned_by_avatar_color"
            size="2.5rem"
          />
          <div class="mx-3">
            <p class="m-0">
              <strong>{{ agency.assigned_by_name }}</strong> shared to <strong>{{ agency.name }}</strong>
            </p>
            <p class="m-0 text-muted">
              <small>{{ formatDateTime(agency.created_at) }}</small>
            </p>
          </div>
        </div>
      </template>
    </div>
  </b-card>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { datadogRum } from '@datadog/browser-rum';
import { newTerminologyEnabled, shareTerminologyEnabled } from '@/helpers/featureFlags';
import { formatDate, formatDateTime } from '@/helpers/dates';
import { gtagEvent } from '@/helpers/gtag';
import UserAvatar from '@/components/UserAvatar.vue';

export default {
  components: { UserAvatar },
  data() {
    return {
      selectedAgencyToAssign: null,
      selectedInterestedCode: null,
      assignedAgencies: [],
    };
  },
  computed: {
    ...mapGetters({
      agencies: 'agencies/agencies',
      currentGrant: 'grants/currentGrant',
    }),
    newTerminologyEnabled,
    shareTerminologyEnabled,
    unassignedAgencies() {
      return this.agencies.filter(
        (agency) => !this.assignedAgencies.map((assigned) => assigned.id).includes(agency.id),
      );
    },
    statusSubmitButtonDisabled() {
      return this.selectedInterestedCode === null;
    },
  },
  async beforeMount() {
    if (this.currentGrant) {
      this.fetchAgencies();
      this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.currentGrant.grant_id });
    }
  },
  methods: {
    formatDate,
    formatDateTime,
    ...mapActions({
      getGrantAssignedAgencies: 'grants/getGrantAssignedAgencies',
      assignAgenciesToGrantAction: 'grants/assignAgenciesToGrant',
      unassignAgenciesToGrantAction: 'grants/unassignAgenciesToGrant',
      fetchAgencies: 'agencies/fetchAgencies',
    }),
    async fetchAssignedAgencies() {
      this.assignedAgencies = await this.getGrantAssignedAgencies({ grantId: this.currentGrant.grant_id });
    },
    async assignAgencyToGrant(agency) {
      await this.assignAgenciesToGrantAction({
        grantId: this.currentGrant.grant_id,
        agencyIds: [agency.id],
      });
      this.selectedAgencyToAssign = null;
      await this.fetchAssignedAgencies();
      const eventName = 'assign team to grant';
      gtagEvent(eventName);
      datadogRum.addAction(eventName);
    },
    async unassignAgencyToGrant(agency) {
      await this.unassignAgenciesToGrantAction({
        grantId: this.currentGrant.grant_id,
        agencyIds: [agency.id],
      });
      await this.fetchAssignedAgencies();
      const eventName = 'remove team assignment from grant';
      gtagEvent(eventName);
      datadogRum.addAction(eventName);
    },
  },
};
</script>

<style scoped>
</style>

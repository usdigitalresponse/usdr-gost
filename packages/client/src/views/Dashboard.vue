<!-- eslint-disable max-len -->
<template>
  <section class="m-3">
    <b-row>
      <b-col cols="4">
        <b-card bg-variant="secondary" text-variant="white" header="Total Grants Matching Search Criteria" class="text-center mb-3">
          <h3>{{totalGrantsMatchingAgencyCriteria}} of {{totalGrants}}</h3>
          <b-link class="stretched-link" to="/grants" />
        </b-card>
        <b-card bg-variant="secondary" text-variant="white" header="New Grants Matching Search Criteria, Last 24Hrs" class="text-center mb-3">
          <h3>{{grantsCreatedInTimeframeMatchingCriteria}} of {{grantsCreatedInTimeframe}}</h3>
          <b-link class="stretched-link" to="/grants" />
          </b-card>
        <b-card bg-variant="secondary" text-variant="white" header="Updated Grants Matching Search Criteria, Last 24Hrs" class="text-center mb-3">
          <h3>{{grantsUpdatedInTimeframeMatchingCriteria}} of {{grantsUpdatedInTimeframe}}</h3>
          <b-link class="stretched-link" to="/grants" />
          </b-card>
      </b-col>
      <b-col cols="4">
        <b-card bg-variant="secondary" text-variant="white" header="Total Viewed Grants" class="text-center mb-3">
          <h3>{{totalViewedGrants}}</h3>
        </b-card>
        <b-card bg-variant="secondary" text-variant="white" header="Total Interested Grants" class="text-center mb-3">
          <h3>{{totalInterestedGrants}}</h3>
          <b-link class="stretched-link" to="/my-grants" />
        </b-card>
        </b-col>
    </b-row>
    <b-card title="Total Interested Grants by Agencies">
      <b-table sticky-header="600px" hover :items="totalInterestedGrantsByAgencies" :fields="groupByFields"></b-table>
    </b-card>
  </section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

import resizableTableMixin from '@/mixin/resizableTable';

export default {
  components: {
  },
  data() {
    return {
      groupByFields: [
        {
          key: 'name',
          sortable: true,
        },
        {
          key: 'abbreviation',
          sortable: true,
        },
        {
          label: 'Total',
          key: 'count',
          sortable: true,
        },
        {
          key: 'interested',
          sortable: true,
        },
        {
          key: 'rejections',
          sortable: true,
        },
      ],
    };
  },
  mixins: [resizableTableMixin],
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
      totalGrants: 'dashboard/totalGrants',
      totalGrantsMatchingAgencyCriteria: 'dashboard/totalGrantsMatchingAgencyCriteria',
      totalViewedGrants: 'dashboard/totalViewedGrants',
      totalInterestedGrants: 'dashboard/totalInterestedGrants',
      grantsCreatedInTimeframe: 'dashboard/grantsCreatedInTimeframe',
      grantsCreatedInTimeframeMatchingCriteria: 'dashboard/grantsCreatedInTimeframeMatchingCriteria',
      grantsUpdatedInTimeframe: 'dashboard/grantsUpdatedInTimeframe',
      grantsUpdatedInTimeframeMatchingCriteria: 'dashboard/grantsUpdatedInTimeframeMatchingCriteria',
      totalInterestedGrantsByAgencies: 'dashboard/totalInterestedGrantsByAgencies',
      selectedAgency: 'users/selectedAgency',
    }),
  },
  watch: {
    selectedAgency() {
      this.setup();
    },
  },
  methods: {
    ...mapActions({
      fetchDashboard: 'dashboard/fetchDashboard',
    }),
    setup() {
      this.fetchDashboard();
    },
  },
};
</script>

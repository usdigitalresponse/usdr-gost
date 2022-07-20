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
      <b-table sticky-header="600px" hover :items="totalInterestedGrantsByAgencies" :fields="groupByFields">
        <template #cell()="{field, value}">
          <div :style="field.style" v-text="value"></div>
        </template>
      </b-table>
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
          thStyle: {
            width: '40%',
          },
        },
        {
          label: 'Total',
          key: 'count',
          sortable: true,
          style: {
            'font-weight': 'bold',
          },
          thStyle: {
            // makes monetary value column closer, also gives more space for grant money value since it will be a longer number
            width: '1%',
          },
        },
        {
          label: ' ',
          key: 'total_grant_money',
          sortByFormatted: false,
          formatter: (value) => {
            const res = value;
            return (`($${res})`);
          },
        },
        {
          key: 'interested',
          sortable: true,
          style: {
            'font-weight': 'bold',
          },
          thStyle: {
            // makes monetary value column closer, also gives more space for grant money value since it will be a longer number
            width: '1%',
          },
        },
        {
          label: ' ',
          key: 'total_interested_grant_money',
          sortByFormatted: false,
          formatter: (value) => {
            const res = value;
            return (`($${res})`);
          },
          style: {
            color: 'green',
          },
        },
        {
          key: 'rejections',
          style: {
            'font-weight': 'bold',
          },
          sortable: true,
          thStyle: {
            // makes monetary value column closer, also gives more space for grant money value since it will be a longer number
            width: '1%',
          },
        },
        {
          label: '   ',
          key: 'total_rejected_grant_money',
          sortByFormatted: false,
          formatter: (value) => {
            const res = value;
            return (`($${res})`);
          },
          style: {
            color: 'red',
          },
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

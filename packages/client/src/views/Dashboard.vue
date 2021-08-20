<template>
  <section class="m-4">
    <b-card-group columns>
        <b-card bg-variant="secondary" text-variant="white" header="Total Grants Matching Search Criteria" class="text-center">
          <h3>{{totalGrantsMatchingAgencyCriteria}} of {{totalGrants}}</h3>
          <b-link class="stretched-link" to="/grants" />
        </b-card>
        <b-card bg-variant="secondary" text-variant="white" header="Total Viewed Grants" class="text-center">
          <h3>{{totalViewedGrants}}</h3>
        </b-card>
        <b-card bg-variant="secondary" text-variant="white" header="Total Interested Grants" class="text-center">
          <h3>{{totalInterestedGrants}}</h3>
        </b-card>
        <b-card bg-variant="secondary" text-variant="white" header="Total Grants Last 24hrs" class="text-center">
          <h3>{{totalGrantsBetweenDates}}</h3>
        </b-card>
    </b-card-group>
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
    this.fetchDashboard();
  },
  computed: {
    ...mapGetters({
      totalGrants: 'dashboard/totalGrants',
      totalGrantsMatchingAgencyCriteria: 'dashboard/totalGrantsMatchingAgencyCriteria',
      totalViewedGrants: 'dashboard/totalViewedGrants',
      totalInterestedGrants: 'dashboard/totalInterestedGrants',
      totalGrantsBetweenDates: 'dashboard/totalGrantsBetweenDates',
      totalInterestedGrantsByAgencies: 'dashboard/totalInterestedGrantsByAgencies',
    }),
  },
  methods: {
    ...mapActions({
      fetchDashboard: 'dashboard/fetchDashboard',
    }),
  },
};
</script>

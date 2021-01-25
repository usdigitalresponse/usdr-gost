<template>
  <section class="m-4">
    <b-card-group columns>
        <b-card bg-variant="secondary" text-variant="white" header="Total Grants" class="text-center">
          <h3>{{totalGrants}}</h3>
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
        <b-card title="Total Interested Grants by Agencies">
      <b-table sticky-header="600px" hover :items="totalInterestedGrantsByAgencies" :fields="groupByFields"></b-table>
    </b-card>
    </b-card-group>
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
          key: 'count',
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

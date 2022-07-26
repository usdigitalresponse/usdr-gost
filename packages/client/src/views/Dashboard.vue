<!-- eslint-disable max-len -->
<template>
  <section class='m-3'>
    <!-- couple options here, could use card-group, could use container, could use card-deck, card-columns -->
    <div class="px-5">
      <!-- adds padding in the margin -->
      <b-container fluid>
        <div class="row">
          <b-col cols="1"></b-col>
          <b-col>
            <b-card title='Recent Activity'>
              <!-- added -> :sort-by.sync="sortBy" :sort-desc.sync="sortAsc" for sorting -->
              <b-table sticky-header='300px' hover :items='activityItems' :fields='activityFields'
                :sort-by.sync="sortBy" :sort-desc.sync="sortAsc" class='table table-borderless' thead-class="d-none">
                <template #cell(icon)="list">
                  <!-- if interested, display check, if not display X -->
                  <b-icon v-if="list.item.interested" icon="check-circle-fill" scale="1" variant="success"></b-icon>
                  <b-icon v-else icon="x-circle-fill" scale="1" variant="danger"></b-icon>
                </template>
                <template #cell(agencyAndGrant)="agencies">
                  <!-- display agency then either interested or rejected, then the grant all in the same line -->
                  <div>{{ agencies.item.agency }}
                    <span v-if="agencies.item.interested"> is
                      <span class="color-green">interested </span> in
                    </span>
                    <span v-if="!agencies.item.interested" class="color-red"> rejected </span>{{ agencies.item.grant }}
                  </div>
                </template>
                <template #cell(date)="dates">
                  <!-- make the dates gray -->
                  <div class="color-gray">{{ dates.item.date }}</div>
                </template>
              </b-table>
              <b-row align-v="center">
                <!-- see all button -->
                <b-button variant="link" size="sm" color="primary" class="mr-1" @click="seeAllActivity">
                  See All Activity
                </b-button>
              </b-row>
            </b-card>
          </b-col>
          <b-col>
            <b-card title='Upcoming Closing Dates'>
              <b-table sticky-header='350px' hover :items='upcomingItems' :fields='upcomingFields'
                class='table table-borderless' thead-class="d-none">
                <template #cell(date)="dates">
                  <!-- color the date to gray, yellow, or red based on the dateColor boolean -->
                  <div v-if="dates.item.dateColor === 0" class="color-gray">{{ dates.item.date }}</div>
                  <div v-if="dates.item.dateColor === 1" class="color-yellow">{{ dates.item.date }}</div>
                  <div v-if="dates.item.dateColor === 2" class="color-red">{{ dates.item.date }}</div>
                </template>
                <template #cell(agencyAndGrant)="agencies">
                  <!-- display the interestedAgencies in a new <div> so it appears below the grant -->
                  <div>{{ agencies.item.agencyAndGrant }}</div>
                  <div class="color-gray">{{ agencies.item.interestedAgencies }}</div>
                </template>
              </b-table>
              <b-row align-v="center">
                <!-- see all button -->
                <b-button variant="link" size="sm" color="primary" class="mr-1" @click="seeAllUpcoming">
                  See All Upcoming
                </b-button>
              </b-row>
            </b-card>
          </b-col>
          <b-col cols="1"></b-col>
        </div>
      </b-container>
    </div>
    <b-row>
      <b-col cols='4'>
        <b-card bg-variant='secondary' text-variant='white' header='Total Grants Matching Search Criteria'
          class='text-center mb-3'>
          <h3>{{ totalGrantsMatchingAgencyCriteria }} of {{ totalGrants }}</h3>
          <b-link class='stretched-link' to='/grants' />
        </b-card>
        <b-card bg-variant='secondary' text-variant='white' header='New Grants Matching Search Criteria, Last 24Hrs'
          class='text-center mb-3'>
          <h3>{{ grantsCreatedInTimeframeMatchingCriteria }} of {{ grantsCreatedInTimeframe }}</h3>
          <b-link class='stretched-link' to='/grants' />
        </b-card>
        <b-card bg-variant='secondary' text-variant='white' header='Updated Grants Matching Search Criteria, Last 24Hrs'
          class='text-center mb-3'>
          <h3>{{ grantsUpdatedInTimeframeMatchingCriteria }} of {{ grantsUpdatedInTimeframe }}</h3>
          <b-link class='stretched-link' to='/grants' />
        </b-card>
      </b-col>
      <b-col cols='4'>
        <b-card bg-variant='secondary' text-variant='white' header='Total Viewed Grants' class='text-center mb-3'>
          <h3>{{ totalViewedGrants }}</h3>
        </b-card>
        <b-card bg-variant='secondary' text-variant='white' header='Total Interested Grants' class='text-center mb-3'>
          <h3>{{ totalInterestedGrants }}</h3>
          <b-link class='stretched-link' to='/my-grants' />
        </b-card>
      </b-col>
    </b-row>
    <b-card title='Total Interested Grants by Agencies'>
      <b-table sticky-header='600px' hover :items='totalInterestedGrantsByAgencies' :fields='groupByFields'></b-table>
    </b-card>
  </section>
</template>
<style scoped>
.color-gray{
color: gray;
}

.color-yellow {
  /* darkkhaki is used in place of traditional yellow for readability */
  color: darkkhaki;
}

.color-red {
  color: red;
}

.color-green {
  color: green;
}
</style>

<script>

import { mapActions, mapGetters } from 'vuex';

import resizableTableMixin from '@/mixin/resizableTable';

export default {
  components: {
  },
  data() {
    return {
      sortBy: 'dateSort',
      sortAsc: true,

      activityFields: [
        {
          // col for the check or X icon
          key: 'icon',
          label: '',
          thStyle: { width: '1%' },
        },
        {
          // col for the agency is interested or not in grant
          key: 'agencyAndGrant',
          label: '',
          thStyle: { width: '79%' },
        },
        {
          // col for when the event being displayed happened
          key: 'date',
          label: '',
          thStyle: { width: '20%' },
          sortable: true,
        },
      ],
      upcomingFields: [
        {
          // col for Grants and interested agencies
          key: 'agencyAndGrant',
          label: '',
          thStyle: { width: '80%' },
        },
        {
          // col for when the grant will be closing
          key: 'date',
          label: '',
          thStyle: { width: '20%' },
        },
      ],
      upcomingItems: [
        {
          agencyAndGrant: 'FY21 Supplemental for the Northeast Corridor Cooperative Agreement to the National Railroad Passenger Corporation',
          interestedAgencies: 'Dept of Admin, State of Nevada,',
          date: '12/12/12',
          dateColor: 2, // 2 corresponds to red, 1 corresponds to yellow, 0 corresponds to gray
        },
        {
          agencyAndGrant: 'Environmental Justice Collaborative Problem-Solving (EJCPS) Cooperative Agreement Program',
          interestedAgencies: 'GO, AP, SNV',
          date: '12/12/12',
          dateColor: 1,
        },
        {
          agencyAndGrant: 'Strengthening Public Health Research and Implementation Science (Operations Research) to Control and Eliminate Infectious Diseases Globally',
          interestedAgencies: 'SHRAB, SNV',
          date: '12/20/12',
          dateColor: 0,
        },
      ],
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
      grants: 'grants/grants',
      grantsInterested: 'grants/grantsInterested',
    }),
    activityItems() {
      const rtf = new Intl.RelativeTimeFormat('en', {
        numeric: 'auto',
      });
      const oneDayInMs = 1000 * 60 * 60 * 24;
      return this.grantsInterested.map((grantsInterested) => ({
        agency: grantsInterested.name,
        grant: grantsInterested.title,
        interested: !grantsInterested.is_rejection,
        dateSort: new Date(grantsInterested.created_at).toLocaleString(),
        date: rtf.format(Math.round((new Date(grantsInterested.created_at).getTime() - new Date().getTime()) / oneDayInMs), 'day').charAt(0).toUpperCase() + rtf.format(Math.round((new Date(grantsInterested.created_at).getTime() - new Date().getTime()) / oneDayInMs), 'day').slice(1),
      }));
    },
  },
  watch: {
    selectedAgency() {
      this.setup();
    },
  },
  methods: {
    ...mapActions({
      fetchDashboard: 'dashboard/fetchDashboard',
      fetchGrantsInterested: 'grants/fetchGrantsInterested',
    }),
    setup() {
      this.fetchDashboard();
      this.fetchGrantsInterested();
    },
    seeAllActivity() {
      // this is where the method for the button press will go
    },
    seeAllUpcoming() {
      // this is where the method for the button press will go
    },
  },
};
</script>

<!-- eslint-disable max-len -->
<template>
  <section class='m-3'>
    <div class="px-5">
      <b-container fluid>
        <div class="row">
          <b-col cols="1"></b-col>
          <b-col>
            <b-card title='Recent Activity'>
              <b-table sticky-header='300px' hover :items='activityItems' :fields='activityFields'
                :sort-by.sync="sortBy" :sort-desc.sync="sortAsc" class='table table-borderless overflow-hidden' thead-class="d-none">
                <template #cell(icon)="list">
                  <b-icon v-if="list.item.interested" icon="check-circle-fill" scale="1" variant="success"></b-icon>
                  <b-icon v-else icon="x-circle-fill" scale="1" variant="danger"></b-icon>
                </template>
                <template #cell(agencyAndGrant)="agencies">
                  <div>{{ agencies.item.agency }}
                    <span v-if="agencies.item.interested"> is
                      <span class="color-green">interested </span> in
                    </span>
                    <span v-if="!agencies.item.interested" class="color-red"> rejected </span>{{ agencies.item.grant }}
                  </div>
                </template>
                <template #cell(date)="dates">
                  <div class="color-gray">{{ dates.item.date }}</div>
                </template>
              </b-table>
              <b-row align-v="center">
                <b-navbar toggleable="sm py-0" bg-transparent>
                  <a class="nav-link active" href="#/RecentActivity">See All Activity</a>
                </b-navbar>
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
        <b-card bg-variant='secondary' text-variant='white' header='New Grants Matching Search Criteria, Last 24Hrs'
          class='text-center mb-3 mt-3'>
          <h3>{{ grantsCreatedInTimeframeMatchingCriteria }} of {{ grantsCreatedInTimeframe }}</h3>
          <b-link class='stretched-link' to='/grants' />
        </b-card>
      </b-col>
      <b-col cols='4'>
        <b-card bg-variant='secondary' text-variant='white' header='Updated Grants Matching Search Criteria, Last 24Hrs'
          class='text-center mb-3 mt-3'>
          <h3>{{ grantsUpdatedInTimeframeMatchingCriteria }} of {{ grantsUpdatedInTimeframe }}</h3>
          <b-link class='stretched-link' to='/grants' />
        </b-card>
      </b-col>
      <b-col cols='4'>
        <b-card bg-variant='secondary' text-variant='white' header='Total Grants Matching Search Criteria'
          class='text-center mb-3 mt-3'>
          <h3>{{ totalGrantsMatchingAgencyCriteria }} of {{ totalGrants }}</h3>
          <b-link class='stretched-link' to='/grants' />
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
            // makes monetary value column closer,
            // also gives more space for grant money value since it will be a longer number
            width: '1%',
          },
        },
        {
          label: ' ',
          key: 'total_grant_money',
          sortByFormatted: false,
          formatter: 'formatMoney',
        },
        {
          key: 'interested',
          sortable: true,
          style: {
            'font-weight': 'bold',
          },
          thStyle: {
            // makes monetary value column closer,
            // also gives more space for grant money value since it will be a longer number
            width: '1%',
          },
        },
        {
          label: ' ',
          key: 'total_interested_grant_money',
          sortByFormatted: false,
          formatter: 'formatMoney',
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
            // makes monetary value column closer,
            // also gives more space for grant money value since it will be a longer number
            width: '1%',
          },
        },
        {
          label: '   ',
          key: 'total_rejected_grant_money',
          sortByFormatted: false,
          formatter: 'formatMoney',
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
      grants: 'grants/grants',
      grantsInterested: 'grants/grantsInterested',
      getClosestGrants: 'grants/getClosestGrants',
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
    seeAllUpcoming() {
      // this is where the method for the button press will go
    },
    formatMoney(value) {
      const res = Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'currency',
        currency: 'USD',
      });
      return (`(${res})`);
    },
  },
};
</script>

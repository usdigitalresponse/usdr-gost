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
              <b-table sticky-header='600px' hover :items='activityItems' :fields='activityFields'
                class='table table-borderless' thead-class="d-none">
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
              <b-table sticky-header='600px' hover :items='getClosestGrants' :fields='upcomingFields'
                class='table table-borderless' thead-class="d-none">
                <template #cell()="{field, value}">
                  <div v-if="yellowDate == true" :style="field.trStyle" v-text="value"></div>
                  <div v-if="redDate == true" :style="field.tdStyle" v-text="value"></div>
                </template>
                <!-- <template #cell(dat)="{field, value}">
                  <div :style="field.style" v-text="value"></div>
                </template> -->
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

<style scoped>
.color-gray{
  color: gray;
}
.color-yellow{
  /* darkkhaki is used in place of traditional yellow for readability */
  color:darkkhaki;
}
.color-red{
  color:red;
}
.color-green{
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
      dateColors: {
        yellowDate: null,
        redDate: null,
      },
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
      activityItems: [
        {
          agency: 'Historical Records Advisory Board',
          grant: 'FY21 Supplemental for the Northeast Corridor..',
          interested: true,
          date: 'Today',
        },
        {
          agency: 'State of Nevada',
          grant: 'Environmental Justice Collaborative Problem...',
          interested: false,
          date: 'Today',
        },
        {
          agency: 'Deparment of Administration',
          grant: 'FY21 Supplemental for the Northeast Corridor...',
          interested: true,
          date: 'Yesterday',
        },
        {
          icon: false,
          agency: 'Historical Records Advisory Board',
          grant: 'Strengthening Public Health Research and...',
          interested: false,
          date: '2 days ago',
        },
      ],
      upcomingFields: [
        {
          // col for Grants and interested agencies
          key: 'title',
          label: '',
          thStyle: { width: '80%' },
        },
        {
          // col for when the grant will be closing
          key: 'close_date',
          label: '',
          formatter: 'formatDate',
          thStyle: { width: '20%' },
          tdStyle: {
            color: 'red',
          },
          trStyle: {
            color: 'darkkhaki',
          },
        },
        {
          key: 'interested_agencies',
          label: '',
          formatter: 'getInterestedAgens',
          thStyle: { width: '20%' },
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
      getClosestGrants: 'dashboard/getClosestGrants',
      grants: 'grants/grants',
      loggedInUser: 'users/loggedInUser',
      agency: 'users/agency',
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
      getInterestedAgencies: 'grants/getInterestedAgencies',
      getAgency: 'agencies/getAgency',
    }),
    setup() {
      this.fetchDashboard();
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
    formatDate(value) {
      //                  get threshold of agency
      const warn = this.agency.warning_threshold;
      const danger = this.agency.danger_threshold;
      //                    current date + danger threshold
      const dangerDate = new Date(new Date().setDate(new Date().getDate() + danger));
      console.log(`dangerDate  ${dangerDate}`);
      //                grant close date + danger thresh
      const dangerDate2 = new Date(new Date().setDate(new Date(value).getDate() + danger));
      console.log(`dangerDate2  ${dangerDate2}`);
      //                grant close date + warn thresh
      const warnDate = new Date(new Date().setDate(new Date(value).getDate() + warn));
      console.log(`warnDate  ${warnDate}`);
      console.log(`close date format for comp  ${new Date(value)}`);
      //          if the grant close date is <= danger date
      if (new Date(value) <= warnDate && new Date(value) > dangerDate2) {
        // make text yellow
        this.yellowDate = true;
        console.log('test2');
      } else if (new Date(value) <= dangerDate2) {
        this.redDate = true;
        console.log('test 3');
        // make red
      }
      //                      format date in MM/DD/YY
      const year = value.slice(2, 4);
      const month = value.slice(5, 7);
      const day = value.slice(8, 10);
      const finalDate = [month, day, year].join('/');
      return (`${finalDate}`);
    },
    getInterestedAgens() {
      //                     <///// getting row grant id x
      // let id1;
      // // let id2;
      // // let id3;
      // for (let i = 0; i < this.getClosestGrants.length; i += 1) {
      //   // console.log(`grnat id:  ${this.getClosestGrants[i].grant_id}`);
      //   if (i === 0) { id1 = this.getClosestGrants[i].grant_id; }
      //   // if (i === 1) { id2 = this.getClosestGrants[i].grant_id; }
      //   // if (i === 2) { id3 = this.getClosestGrants[i].grant_id; }
      // }
      // //                  <///// put row id in this.getInterestedAgencies func
      // console.log(`poiuytre2  ${JSON.stringify(this.getInterestedAgencies({ grantId: this.getClosestGrants[0].grant_id }).then((data) => data)
      //   .catch((err) => err))}`);
      // return JSON.stringify(this.getInterestedAgencies({ grantId: id1 }).then((data) => data)
      //   .catch((err) => err));

      //                <///// grants pagination map
      // return this.grants.map((grant) => ({
      //   interested_agencies: grant.interested_agencies
      //     .map((v) => v.agency_abbreviation)
      //     .join(', '),
      // }));

      return this.getInterestedAgencies({ grantId: this.getClosestGrants[0].grant_id });

      //                     </////promise
      // const promise1 = new Promise((resolve) => {
      //   resolve(this.getInterestedAgencies({ grantId: id1 }));
      // });
      // promise1.then((value) => {
      //   console.log(value);
      //   return value;
      // });
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

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
          key: 'grant_id',
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
      getInterestedAgenciesAction: 'grants/getInterestedAgencies',
      getAgency: 'agencies/getAgency',
      fetchInterestedAgencies: 'grants/fetchInterestedAgencies',
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
      // console.log(`format date:  ${value}`);
      const warn = this.agency.warning_threshold;
      const danger = this.agency.danger_threshold;
      //                    current date + danger threshold
      // const dangerDate = new Date(new Date().setDate(new Date().getDate() + danger));
      // console.log(`dangerDate  ${dangerDate}`);
      //                grant close date + danger thresh
      const dangerDate2 = new Date(new Date().setDate(new Date(value).getDate() + danger));
      // console.log(`dangerDate2  ${dangerDate2}`);
      //                grant close date + warn thresh
      const warnDate = new Date(new Date().setDate(new Date(value).getDate() + warn));
      // console.log(`warnDate  ${warnDate}`);
      // console.log(`close date format for comp  ${new Date(value)}`);
      //          if the grant close date is <= danger date
      if (new Date(value) <= warnDate && new Date(value) > dangerDate2) {
        this.yellowDate = true;
      } else if ((new Date(value) <= dangerDate2) || (new Date(value) === new Date())) {
        this.redDate = true;
      }
      //                      format date in MM/DD/YY
      const year = value.slice(2, 4);
      const month = value.slice(5, 7);
      const day = value.slice(8, 10);
      const finalDate = [month, day, year].join('/');
      return (`${finalDate}`);
    },
    async getInterestedAgens(val) {
      //                  <///// direct api call
      // const res = this.getInterestedAgenciesAction({ grantId: val });
      // console.log(`res:  ${res}`);
      // await Promise.resolve(res).then((value) => (value));
      // console.log(await Promise.resolve(res).then((value) => (value)));
      // return res;

      // const arr = await this.getInterestedAgenciesAction({ grantId: val });
      // const res = JSON.stringify(arr[0].agency_abbreviation);
      // console.log(`res:  ${res}`);
      // await new Promise((resolve) => setTimeout(resolve, 5000));
      // console.log(`res2:  ${res}`);
      // return res;
      console.log(val);
      // let arr = [];
      const arr = await this.getInterestedAgenciesAction({ grantId: val });
      const res = JSON.stringify(arr[0].agency_abbreviation);
      console.log(`res:  ${res}`);
      return res;

      // this.getInterestedAgenciesAction({ grantId: val }).then((arr) => {
      //   const res = arr[0].agency_abbreviation;
      //   console.log(`res:  ${res}`);
      //   return res;
      // });

      // try {
      //   let arr = [];
      //   arr = await this.getInterestedAgenciesAction({ grantId: val });
      //   const res = JSON.stringify(arr[0].agency_abbreviation);
      //   console.log(`res:  ${res}`);
      //   return res;
      // } catch (err) {
      //   console.log(err);
      //   return err;
      // }

      //                <///// grants pagination map
      // return this.grants.map((grant) => (
      //   grant.interested_agencies
      //     .map((grantId) => grantId.agency_abbreviation)
      // ));

      //                <///// grants filter map
      // const res = this.grants.filter((grant) => grant.grant_id === val);
      // console.log(`res:   ${JSON.stringify(res)}`);
      // console.log(`res[0]:   ${JSON.stringify(res[0].grant_number)}`);
      // return res[0];
      //                     </////promise
      // const promise1 = new Promise((resolve) => {
      //   resolve(JSON.stringify(this.getInterestedAgenciesAction({ grantId: val }))[0].title);
      // });
      // promise1.then((value) => {
      //   console.log(`promise1: ${promise1}`);
      //   return value;
      // }).catch((err) => err);
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

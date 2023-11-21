<template>
  <section class="container">
    <b-card class="border-0">
    <div class="d-flex">
      <h4 class="card-title gutter-title1 row">Recent Activity</h4>
      <div class="justify-content-end left-margin">
        <b-button @click="exportCSV" :disabled="loading" variant="outline-secondary">
        <b-icon icon="download" class="mr-1 mb-1" font-scale="0.9" aria-hidden="true" />
          Export to CSV
        </b-button>
      </div>
    </div>
    <b-table
      hover
      :items="activityItems"
      :fields="activityFields"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortAsc"
      class="table table-borderless"
      thead-class="d-none"
      selectable
      select-mode="single"
      @row-selected="onRowSelected"
    >
      <template #cell(icon)="list">
        <div class="gutter-icon row">
        <b-icon v-if="list.item.interested === 0" icon="x-circle-fill" scale="1" variant="danger"></b-icon>
        <b-icon v-if="list.item.interested === 1" icon="check-circle-fill" scale="1" variant="success"></b-icon>
        <b-icon v-if="list.item.interested === 2" icon="arrow-right-circle-fill" scale="1"></b-icon>
        <b-icon v-if="list.item.interested === 3" icon="award" scale="1" class="color-yellow"></b-icon>
        <b-icon v-if="list.item.interested === 4" icon="check-circle-fill" scale="1" class="color-green"></b-icon>
        </div>
      </template>
      <template #cell(agencyAndGrant)="agencies">
        <div>{{ agencies.item.agency }}
          <span v-if="agencies.item.interested === 0" class="color-red" > <strong> rejected </strong> </span>
          <span v-if="agencies.item.interested === 1" > is
            <span class="color-green">
              <strong> interested </strong>
              </span> in
            </span>
          <span v-if="agencies.item.interested === 2" > was<strong> assigned </strong> </span>
          <span v-if="agencies.item.interested === 3" > was<strong><span class="color-yellow"> awarded </span></strong> </span>
          <span v-if="agencies.item.interested === 4" ><strong><span class="color-green"> applied </span></strong>for </span>{{ agencies.item.grant }}
        </div>
      </template>
      <template #cell(date)="dates">
        <div class="color-gray">{{ dates.item.date }}</div>
      </template>
    </b-table>
    </b-card>
    <b-row align-v="center">
      <b-pagination class="m-0" v-model="currentPage" :total-rows="totalRows" :per-page="perPage" first-number
        last-number first-text="First" prev-text="Prev" next-text="Next" last-text="Last"
        aria-controls="grants-table" />
      <b-button class="ml-2" variant="outline-primary disabled">{{ grantsInterested.length }} of {{ totalRows }}</b-button>
    </b-row>
    <GrantDetails :selected-grant.sync="selectedGrant" />
  </section>
</template>
<style scoped>
.color-gray {
  color: #757575
}
.color-red {
  color: #ae1818;
}
.color-green {
  color: green;
}
.color-yellow{
  color: #aa8866;
}
.gutter-icon.row {
    margin-right: -8px;
    margin-left: -8px;
    margin-top: 3px;
  }
   .gutter-title1.row {
    margin-left: +4px;
  }
</style>

<script>
import { mapActions, mapGetters } from 'vuex';
import resizableTableMixin from '@/mixin/resizableTable';
import GrantDetails from '@/components/Modals/GrantDetails.vue';

export default {
  components: { GrantDetails },
  data() {
    return {
      perPage: 10,
      currentPage: 1,
      sortBy: 'dateSort',
      sortAsc: true,
      activityFields: [
        {
          key: 'icon',
          label: '',
          thStyle: { width: '1%' },
        },
        {
          key: 'agencyAndGrant',
          label: '',
          thStyle: { width: '79%' },
        },
        {
          key: 'date',
          label: '',
          thStyle: { width: '20%' },
        },
      ],
      selectedGrant: null,
    };
  },
  mixins: [resizableTableMixin],
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
      grants: 'grants/grants',
      grantsInterested: 'grants/grantsInterested',
      totalInterestedGrants: 'dashboard/totalInterestedGrants',
      currentGrant: 'grants/currentGrant',
    }),
    activityItems() {
      const rtf = new Intl.RelativeTimeFormat('en', {
        numeric: 'auto',
      });
      const oneDayInMs = 1000 * 60 * 60 * 24;
      return this.grantsInterested.map((grantsInterested) => ({
        agency: grantsInterested.name,
        grant: grantsInterested.title,
        grant_id: grantsInterested.grant_id,
        interested: (() => {
          let retVal = null;
          if (grantsInterested.status_code != null) {
            if (grantsInterested.status_code === 'Rejected') {
              retVal = 0;
            } else if ((grantsInterested.status_code === 'Interested')) {
              retVal = 1;
            } else if ((grantsInterested.status_code === 'Result')) {
              if (grantsInterested.interested_name === 'Awarded') {
                retVal = 3;
              } else if (grantsInterested.interested_name === 'Applied') {
                retVal = 4;
              }
            }
          } else if (grantsInterested.assigned_by != null) {
            // 2 means its assigned not interested
            retVal = 2;
          }
          return retVal;
        })(),
        dateSort: new Date(grantsInterested.created_at).toLocaleString(),
        date: (() => {
          const timeSince = rtf.format(Math.round((new Date(grantsInterested.created_at).getTime() - new Date().getTime()) / oneDayInMs), 'day');
          const timeSinceInt = parseInt(timeSince, 10);
          if (!Number.isNaN(timeSinceInt) && timeSinceInt > 7) {
            return new Date(grantsInterested.created_at).toLocaleDateString('en-US');
          }
          return timeSince.charAt(0).toUpperCase() + timeSince.slice(1);
        })(),
      }));
    },
    totalRows() {
      return this.totalInterestedGrants;
    },
  },
  watch: {
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
    currentPage() {
      this.setup();
    },
  },
  methods: {
    ...mapActions({
      fetchDashboard: 'dashboard/fetchDashboard',
      fetchGrantsInterested: 'grants/fetchGrantsInterested',
      fetchGrantDetails: 'grants/fetchGrantDetails',
      exportCSVRecentActivities: 'grants/exportCSVRecentActivities',
    }),
    setup() {
      this.fetchDashboard();
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
    exportCSV() {
      this.exportCSVRecentActivities();
    },
  },
};
</script>

<style scoped>
.left-margin {
  margin-left: auto;
}
</style>

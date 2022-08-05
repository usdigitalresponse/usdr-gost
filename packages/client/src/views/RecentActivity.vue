<template>
  <section class="container">
    <b-card class="border-0">
      <h4 class="card-title gutter-title1 row">Recent Activity</h4>
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
        <b-icon
          v-if="list.item.interested"
          icon="check-circle-fill"
          scale="1"
          variant="success"
        ></b-icon>
        <b-icon v-else icon="x-circle-fill" scale="1" variant="danger"></b-icon>
        </div>
      </template>
      <template #cell(agencyAndGrant)="agencies">
        <div>
          {{ agencies.item.agency }}
          <span v-if="agencies.item.interested">
            is <span class="color-green"> <strong> interested </strong></span> in
          </span>
          <span v-if="!agencies.item.interested" class="color-red"><strong>
            rejected </strong></span
          >{{ agencies.item.grant }}
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
        interested: !grantsInterested.is_rejection,
        dateSort: new Date(grantsInterested.created_at).toLocaleString(),
        date: rtf.format(Math.round((new Date(grantsInterested.created_at).getTime() - new Date().getTime()) / oneDayInMs), 'day').charAt(0).toUpperCase() + rtf.format(Math.round((new Date(grantsInterested.created_at).getTime() - new Date().getTime()) / oneDayInMs), 'day').slice(1),
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
  },
};
</script>

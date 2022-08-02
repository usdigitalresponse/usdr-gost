<template>
  <section class="container">
    <b-card title='Recent Activity' class="border-0">
    <b-table
      hover
      :items="activityItems"
      :fields="activityFields"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortAsc"
      class="table table-borderless"
      thead-class="d-none"
    >
      <template #cell(icon)="list">
        <b-icon
          v-if="list.item.interested"
          icon="check-circle-fill"
          scale="1"
          variant="success"
        ></b-icon>
        <b-icon v-else icon="x-circle-fill" scale="1" variant="danger"></b-icon>
      </template>
      <template #cell(agencyAndGrant)="agencies">
        <div>
          {{ agencies.item.agency }}
          <span v-if="agencies.item.interested">
            is <span class="color-green">interested </span> in
          </span>
          <span v-if="!agencies.item.interested" class="color-red">
            rejected </span
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
  </section>
</template>
<style scoped>
.color-gray {
  color: gray;
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
  components: {},
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
    totalRows() {
      return this.totalInterestedGrants;
    },
  },
  watch: {
    currentPage() {
      // this.fetchGrantsInterested({ perPage: this.perPage, currentPage: this.currentPage + 1 });
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
      this.fetchGrantsInterested({ perPage: this.perPage, currentPage: this.currentPage });
    },
  },
};
</script>

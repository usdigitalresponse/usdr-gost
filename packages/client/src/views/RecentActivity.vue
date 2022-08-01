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
      selectable
      select-mode="single"
      @row-selected="onRowSelected"
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
    <GrantDetails :selected-grant.sync="selectedGrant" />
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
import GrantDetails from '@/components/Modals/GrantDetails.vue';

export default {
  components: { GrantDetails },
  data() {
    return {
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
      workingGrant: 'grants/workingGrant',
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
  },
  watch: {
    async selectedGrant() {
      if (!this.selectedGrant) {
        await this.fetchGrantsInterested();
      }
    },
    workingGrant() {
      if (this.selectedGrant && this.workingGrant) {
        this.onRowSelected([this.workingGrant]);
      }
    },
  },
  methods: {
    ...mapActions({
      // fetchDashboard: 'dashboard/fetchDashboard',  seems to work without this
      fetchGrantsInterested: 'grants/fetchGrantsInterested',
      fetchGrantDetails: 'grants/fetchGrantDetails',
    }),
    setup() {
      // this.fetchDashboard(); seems to work without this
      this.fetchGrantsInterested();
    },
    async onRowSelected(items) {
      const [row] = items;
      if (row) {
        await this.fetchGrantDetails({ grantId: row.grant_id }).then(() => {
          this.selectedGrant = this.workingGrant;
        });
      }
    },
  },
};
</script>

<template>
<section class="container">
<b-card class="border-0">
  <h4 class="card-title gutter-title1 row">Upcoming Closing Dates</h4>
    <b-table sticky-header='350px' hover :items='upcomingItems' :fields='upcomingFields'
    class='table table-borderless' thead-class="d-none">
        <template #cell(date)="dates"><strong>
            <!-- color the date to gray, yellow, or red based on the dateColor boolean -->
            <div v-if="dates.item.dateColor === 0" class="color-gray">{{ dates.item.date }}</div>
            <div v-if="dates.item.dateColor === 1" class="color-yellow">{{ dates.item.date }}</div>
            <div v-if="dates.item.dateColor === 2" class="color-red">{{ dates.item.date }}</div>
        </strong>
        </template>
        <template #cell(agencyAndGrant)="agencies">
            <!-- display the interestedAgencies in a new <div> so it appears below the grant -->
            <div>{{ agencies.item.agencyAndGrant }}</div>
            <div class="color-gray">{{ agencies.item.interestedAgencies }}</div>
        </template>
    </b-table>
    </b-card>
    </section>
</template>

<style scoped>
.color-gray {
  color: #757575;
}

.color-red {
  color: #ae1818;
}
.color-yellow{
  color: #aa8866;
}
.gutter-title1.row {
    margin-left: +9px;
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
    };
  },

  mixins: [resizableTableMixin],
  mounted() {
    this.setup();
  },
  computed: {
    ...mapGetters({
    //  Things will need to go here when backend func is added
    }),
  },
  methods: {
    ...mapActions({
    //  Things will need to go here when backend func is added
    //   fetchDashboard: 'dashboard/fetchDashboard',
    //   fetchGrantsInterested: 'grants/fetchGrantsInterested',
    }),
    setup() {
    //  Things will need to go here when backend func is added
    //   this.fetchDashboard();
    //   this.fetchGrantsInterested();
    },
  },
};

</script>

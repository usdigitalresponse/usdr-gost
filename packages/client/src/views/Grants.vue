<template>
<section class="container-fluid">
  <h2>Grants</h2>
  <DataTable v-if="grants" :table="table" :rows="grants" />
</section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

import DataTable from '@/components/Table/DataTable.vue';

export default {
  components: {
    DataTable,
  },
  data() {
    return {
      table: {
        views: [],
        columns: [
          { name: 'grant_id' },
          { name: 'grant_number' },
          { name: 'title' },
          { name: 'status' },
          { name: 'agency_code' },
          { name: 'cost_sharing' },
          { name: 'cfda_list' },
          { name: 'open_date' },
          { name: 'close_date' },
          { name: 'opportunity_category' },
          { name: 'search_terms' },
          { name: 'notes' },
          { name: 'created_at' },
          { name: 'updated_at' },
        ],
      },
    };
  },
  mounted() {
    this.fetchGrants();
  },
  computed: {
    ...mapGetters({
      grants: 'grants/grants',
    }),
  },
  methods: {
    ...mapActions({
      fetchGrants: 'grants/fetchGrants',
    }),
  },
};
</script>

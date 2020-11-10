<template>
<section class="section">
    <div class="container">
      <h1 class="title">Grants</h1>
      <h2 class="subtitle">
      </h2>
      <b-table :data="grants" :columns="columns"
      :sticky-header="true" :height="600"
      :debounce-search="800"
      ></b-table>
    </div>
  </section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      columns: [
        {
          field: 'grant_id',
          label: 'ID',
          width: '40',
          numeric: true,
        },
        {
          field: 'grant_number',
          label: 'Grant Number',
          searchable: true,
        },
        {
          field: 'title',
          label: 'Title',
          searchable: true,
        },
        {
          field: 'status',
          label: 'Status',
        },
        {
          field: 'agency_code',
          label: 'Agency Code',
        },
        {
          field: 'cost_sharing',
          label: 'Cost Sharing',
        },
        {
          field: 'cfda_list',
          label: 'CFDA List',
        },
        {
          field: 'open_date',
          label: 'Open Date',
        },
        {
          field: 'close_date',
          label: 'Close Date',
        },
        {
          field: 'opportunity_category',
          label: 'Opportunity Category',
        },
        {
          field: 'search_terms',
          label: 'Search Terms',
        },
        {
          field: 'notes',
          label: 'Notes',
        },
        {
          field: 'created_at',
          label: 'Created At',
          sortable: true,
        },
        {
          field: 'updated_at',
          label: 'Updated At',
        },
      ],
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

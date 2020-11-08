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
      //       grant_id
      // grant_number
      // title
      // status
      // agency_code
      // award_ceiling
      // cost_sharing
      // cfda_list
      // open_date
      // close_date
      // reviewer_name
      // opportunity_category
      // search_terms
      // notes
      // created_at
      // updated_at
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
          field: 'created_at',
          label: 'Date',
          sortable: true,
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

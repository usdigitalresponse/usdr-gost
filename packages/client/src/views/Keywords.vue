<template>
<section class="section">
    <div class="container">
      <h1 class="title">Keywords</h1>
      <h2 class="subtitle">
      </h2>
      <b-table :data="keywords" :columns="columns"
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
          field: 'id',
          label: 'id',
        },
        {
          field: 'mode',
          label: 'Mode',
          searchable: true,
        },
        {
          field: 'search_term',
          label: 'Search Term',
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
    this.fetchKeywords();
  },
  computed: {
    ...mapGetters({
      keywords: 'grants/keywords',
    }),
  },
  methods: {
    ...mapActions({
      fetchKeywords: 'grants/fetchKeywords',
    }),
  },
};
</script>

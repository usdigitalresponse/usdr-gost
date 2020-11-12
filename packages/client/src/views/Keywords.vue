<template>
<section class="container-fluid">
  <h2>Keywords</h2>
  <DataTable v-if="keywords" :table="table" :rows="keywords" />
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
          { name: 'id' },
          { name: 'mode' },
          { name: 'search_term' },
          { name: 'notes' },
          { name: 'created_at' },
          { name: 'updated_at' },
        ],
      },
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

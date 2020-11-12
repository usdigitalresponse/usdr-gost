<template>
<section class="container-fluid">
  <h2>Eligibility Codes</h2>
  <DataTable v-if="eligibilityCodes" :table="table" :rows="eligibilityCodes" />
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
          { name: 'code' },
          { name: 'label' },
          { name: 'enabled' },
          { name: 'created_at' },
          { name: 'updated_at' },
        ],
      },
    };
  },
  mounted() {
    this.fetchEligibilityCodes();
  },
  computed: {
    ...mapGetters({
      eligibilityCodes: 'grants/eligibilityCodes',
    }),
  },
  methods: {
    ...mapActions({
      fetchEligibilityCodes: 'grants/fetchEligibilityCodes',
    }),
  },
};
</script>

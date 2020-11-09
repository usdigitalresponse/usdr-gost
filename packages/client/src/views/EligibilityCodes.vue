<template>
<section class="section">
    <div class="container">
      <h1 class="title">Eligibility Codes</h1>
      <h2 class="subtitle">
      </h2>
      <b-table :data="eligibilityCodes" :columns="columns"
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
          field: 'code',
          label: 'Code',
        },
        {
          field: 'label',
          label: 'Label',
          searchable: true,
        },
        {
          field: 'enabled',
          label: 'Enabled',
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

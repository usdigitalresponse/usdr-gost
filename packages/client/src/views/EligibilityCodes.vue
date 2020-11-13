<template>
<section class="container-fluid">
  <h2>Eligibility Codes</h2>
  <b-table sticky-header="600px" hover :items="eligibilityCodes" :fields="fields"></b-table>
</section>
</template>

<script>

import { mapActions, mapGetters } from 'vuex';

export default {
  components: {
  },
  data() {
    return {
      fields: [
        {
          key: 'code',
          sortable: true,
          stickyColumn: true,
        },
        {
          key: 'label',
          sortable: false,
        },
        {
          key: 'enabled',
        },
        {
          key: 'created_at',
        },
        {
          key: 'updated_at',
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

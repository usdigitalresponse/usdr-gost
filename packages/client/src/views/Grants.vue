<template>
  <GrantsTable />
</template>

<script>
import { mapActions } from 'vuex';
import GrantsTable from '@/components/GrantsTable.vue';

export default {
  components: { GrantsTable },
  data() {
    return {};
  },
  created() {
    this.fetchAllAgencies();
  },
  methods: {
    ...mapActions({
      fetchAllAgencies: 'agencies/fetchAllAgencies',
    }),
  },
};
</script>

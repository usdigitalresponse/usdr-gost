<template>
<section class="container-fluid">
  <b-row>
    <b-col><h2>Agencies</h2></b-col>
    <b-col></b-col>
  </b-row>
  <b-table sticky-header="600px" hover :items="formattedAgencies" :fields="fields"></b-table>
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
          key: 'name',
          sortable: true,
        },
        {
          key: 'abbreviation',
          sortable: true,
        },
      ],
    };
  },
  mounted() {
    this.fetchAgencies();
  },
  computed: {
    ...mapGetters({
      agencies: 'agencies/agencies',
    }),
    formattedAgencies() {
      return this.agencies.map((agency) => ({
        ...agency,
      }));
    },
  },
  methods: {
    ...mapActions({
      fetchAgencies: 'agencies/fetchAgencies',
      deleteUser: 'agencies/deleteUser',
    }),
    openAddUserModal() {
      this.showAddUserModal = true;
    },
  },
};
</script>

<template>
<section class="container-fluid">
  <h2>Grants</h2>
  <b-table sticky-header="600px" hover :items="grants" :fields="fields"
  selectable
  select-mode="single"
  @row-selected="onRowSelected"
  ></b-table>
   <!-- Info modal -->
  <b-modal v-model="showGrantModal" :title="infoModal.title" ok-only @hide="resetInfoModal">
    <pre>{{ infoModal.content }}</pre>
  </b-modal>
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
          key: 'grant_id',
          stickyColumn: true,
        },
        {
          key: 'grant_number',
        },
        {
          key: 'title',
        },
        {
          key: 'status',
        },
        {
          key: 'agency_code',
        },
        {
          key: 'cost_sharing',
        },
        {
          key: 'open_date',
        },
        {
          key: 'opportunity_category',
        },
        { key: 'search_terms' },
        { key: 'notes' },
        { key: 'created_at' },
        { key: 'updated_at' },
        {
          key: 'created_at',
        },
        {
          key: 'updated_at',
        },
      ],
      showGrantModal: false,
      infoModal: {
        title: '',
        content: '',
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
    showModal() {
      this.$refs['my-modal'].show();
    },
    hideModal() {
      this.$refs['my-modal'].hide();
    },
    onRowSelected(items) {
      const [row] = items;
      this.infoModal.title = row.title;
      this.infoModal.content = JSON.stringify(row, null, 2);
      this.showGrantModal = true;
    },
    resetInfoModal() {
      this.showGrantModal = false;
      this.infoModal.title = '';
      this.infoModal.content = '';
    },
  },
};
</script>

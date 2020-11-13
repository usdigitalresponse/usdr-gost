<template>
<section class="container-fluid">
  <h2>Keywords</h2>
  <b-table sticky-header="600px" hover :items="keywords" :fields="fields"></b-table>
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
          key: 'id',
        },
        {
          key: 'mode',
        },
        {
          key: 'search_term',
        },
        {
          key: 'notes',
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

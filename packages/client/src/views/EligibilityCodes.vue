<template>
<section class="container-fluid">
  <h2>Eligibility Codes</h2>
  <b-table sticky-header="600px" hover :items="eligibilityCodes" :fields="fields">
    <template #cell(enabled)="data">
        <b-form-checkbox
          :checked="data.item.enabled"
          :disabled="userRole === 'staff'"
          @input="updateEnabled(data.item.code, $event)"/>
    </template>
  </b-table>
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
      userRole: 'users/userRole',
    }),
  },
  methods: {
    ...mapActions({
      fetchEligibilityCodes: 'grants/fetchEligibilityCodes',
      setEligibilityCodeEnabled: 'grants/setEligibilityCodeEnabled',
    }),
    updateEnabled(code, enabled) {
      this.setEligibilityCodeEnabled({ code, enabled });
    },
  },
};
</script>

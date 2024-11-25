<template>
  <div>
    <h1>Agency</h1>

    <div
      v-if="agency === null"
      class="spinner-grow text-primary"
      role="status"
    >
      <span class="sr-only">Loading...</span>
    </div>

    <div v-else>
      <StandardForm
        :key="formKey"
        :initial-record="agency"
        :cols="cols"
        @save="onSave"
        @reset="onReset"
      />
    </div>
  </div>
</template>

<script>
import StandardForm from '@/arpa_reporter/components/StandardForm.vue';

import { post } from '@/arpa_reporter/store';

export default {
  name: 'AgencyView',
  components: {
    StandardForm,
  },
  data() {
    return {
      formKey: Date.now(),
    };
  },
  computed: {
    agencyId() {
      return this.$route.params.id;
    },
    isNew() {
      return this.agencyId === 'new';
    },
    agency() {
      if (this.isNew) return {};
      const fromStore = this.$store.state.agencies.find((a) => a.id === Number(this.agencyId));
      return fromStore || null;
    },
    cols() {
      return [
        { label: 'ID', field: 'id', readonly: true },
        { label: 'Agency Code', field: 'code', required: true },
        { label: 'Agency Name', field: 'name', required: true },
      ];
    },
  },
  watch: {
    agencyId() {
      this.onReset();
    },
  },
  async mounted() {
    this.$store.dispatch('updateAgencies');
  },
  methods: {
    async onSave(updatedAgency) {
      try {
        const result = await post('/api/agencies', { agency: updatedAgency });
        if (result.error) throw new Error(result.error);

        const text = this.isNew
          ? `Agency ${updatedAgency.code} successfully created`
          : `Agency ${this.agencyId} successfully updated`;

        this.$store.commit('addAlert', {
          text,
          level: 'ok',
        });

        this.$store.dispatch('updateAgencies');
        if (this.isNew) {
          return this.$router.push(`/agencies/${result.agency.id}`);
        }
      } catch (e) {
        this.$store.commit('addAlert', {
          text: `Error saving agency: ${e.message}`,
          level: 'err',
        });
      }
      return undefined;
    },
    onReset() {
      this.formKey = Date.now();
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/views/Agency.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->

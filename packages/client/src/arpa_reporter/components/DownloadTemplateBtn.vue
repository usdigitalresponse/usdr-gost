<template>
  <DownloadButton :href="href" :classes="classes" :disabled="isDisabled">
    Download Empty Template
  </DownloadButton>
</template>

<script>
import { apiURL } from '@/helpers/fetchApi';
import DownloadButton from './DownloadButton.vue';

export default {
  name: 'DownloadTemplateBtn',
  props: {
    block: Boolean,
  },
  components: {
    DownloadButton,
  },
  computed: {
    periodId() {
      return this.$store.state.viewPeriodID;
    },
    href() {
      return apiURL(`/api/reporting_periods/${this.periodId}/template`);
    },
    isDisabled() {
      return !this.$store.getters.viewPeriodIsCurrent;
    },
    classes() {
      return {
        'btn-block': this.block,
        'btn-secondary': true,
      };
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/components/DownloadTemplateBtn.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->

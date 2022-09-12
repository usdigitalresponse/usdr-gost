<template>
  <DownloadButton :href="href" :classes="classes" :disabled="isDisabled">
    Download Empty Template
  </DownloadButton>
</template>

<script>
import DownloadButton from './DownloadButton.vue'

export default {
  name: 'DownloadTemplateBtn',
  props: {
    block: Boolean
  },
  components: {
    DownloadButton
  },
  computed: {
    periodId: function () {
      return this.$store.state.viewPeriodID
    },
    href: function () {
      return `/api/reporting_periods/${this.periodId}/template`
    },
    isDisabled: function () {
      return !this.$store.getters.viewPeriodIsCurrent
    },
    classes: function () {
      return {
        'btn-block': this.block,
        'btn-secondary': true
      }
    }
  }
}
</script>

<!-- NOTE: This file was copied from src/components/DownloadTemplateBtn.vue (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z -->

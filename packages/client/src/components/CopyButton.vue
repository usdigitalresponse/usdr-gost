<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
  <span
    ref="container"
    class="copy-button"
    @click="copyToClipboard"
  >
    <slot />
    <b-icon
      v-if="!hideIcon"
      :icon="copySuccessTimeout === null ? 'files' : 'check2'"
      :variant="copySuccessTimeout === null ? '' : 'success'"
    />
    <b-tooltip
      v-if="mounted"
      ref="tooltip"
      :target="$refs.container"
      triggers="manual"
      boundary="window"
    >
      <b-icon
        icon="check-circle-fill"
        variant="success"
        class="mr-1"
      />
      Copied
    </b-tooltip>
  </span>
</template>

<script>
export default {
  props: {
    copyText: {
      type: String,
      required: true,
    },
    hideIcon: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      copySuccessTimeout: null,
      mounted: false,
    };
  },
  mounted() {
    this.mounted = true;
  },
  methods: {
    copyToClipboard() {
      navigator.clipboard.writeText(this.copyText);

      this.$refs.tooltip.$emit('open');

      // Show the success indicator
      // (Clear previous timeout to ensure multiple clicks in quick succession don't cause issues)
      clearTimeout(this.copySuccessTimeout);
      this.copySuccessTimeout = setTimeout(() => {
        this.$refs.tooltip.$emit('close');
        this.copySuccessTimeout = null;
      }, 1000);
    },
  },
};
</script>

<style lang="scss">
@import '@/scss/colors-semantic-tokens.scss';

.copy-button {
  cursor: pointer;
  color: $info-default;
}
.copy-button:hover {
  color: $info-hover;
  text-decoration: underline;
}
</style>

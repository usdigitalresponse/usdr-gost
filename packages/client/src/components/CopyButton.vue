<template>
  <span
    ref="container"
    class="copy-button"
    @click="copyToClipboard"
  >
    <slot />
    <b-icon
      :icon="copySuccessTimeout === null ? 'files' : 'check2'"
      :variant="copySuccessTimeout === null ? '' : 'success'"
    />
    <b-tooltip
      v-if="$refs.container"
      :target="$refs.container"
      triggers=""
      :show="copySuccessTimeout !== null"
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
  },
  data() {
    return {
      copySuccessTimeout: null,
    };
  },
  methods: {
    copyToClipboard() {
      navigator.clipboard.writeText(this.copyText);

      // Show the success indicator
      // (Clear previous timeout to ensure multiple clicks in quick succession don't cause issues)
      clearTimeout(this.copySuccessTimeout);
      this.copySuccessTimeout = setTimeout(
        () => { this.copySuccessTimeout = null; },
        1000,
      );
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

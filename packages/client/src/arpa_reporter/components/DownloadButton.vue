<template>
  <a
    download
    :href="href"
    class="btn btn-primary"
    :class="computedClasses"
    @click="setLoadingState"
  >
    <span
      v-if="isLoading"
      class="spinner-border spinner-border-sm"
      role="status"
      aria-hidden="true"
    ></span>
    <span v-if="isLoading"> Loading...</span>
    <span v-else> <slot /></span>
  </a>
</template>

<script>
export default {
  name: 'DownloadButton',
  props: {
    href: String,
    customClass: String,
    classes: Object,
    disabled: Boolean
  },
  mounted () {
    // Browsers don't report feedback when a link with the download attribute
    // has been resolved.  Instead of doing something heavy-handed to work
    // around this, we just assume that loading has resolved once the window
    // regains focus.
    // see also:
    // https://stackoverflow.com/questions/1106377/detect-when-a-browser-receives-a-file-download
    window.addEventListener('focus', this.clearLoadingState)
  },
  destroyed () {
    window.removeEventListener('focus', this.clearLoadingState)
  },
  data () {
    return {
      isLoading: false
    }
  },
  computed: {
    computedClasses () {
      return {
        ...this.classes,
        disabled: this.disabled || this.isLoading
      }
    }
  },
  methods: {
    clearLoadingState () {
      this.isLoading = false
    },
    setLoadingState () {
      this.isLoading = true
    }
  }
}
</script>

<!-- NOTE: This file was copied from src/components/DownloadButton.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->

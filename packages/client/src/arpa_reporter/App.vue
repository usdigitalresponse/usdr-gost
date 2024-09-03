<template>
  <div id="app">
    <PageNavigation />
  </div>
</template>

<script>
import '@/arpa_reporter/scss/index.scss';
import 'bootstrap/dist/js/bootstrap.min';

import PageNavigation from '@/arpa_reporter/components/PageNavigation.vue';

export default {
  name: 'App',
  components: {
    PageNavigation,
  },
};
</script>

<style lang="scss">
@import 'bootstrap/scss/bootstrap.scss';
@import 'bootstrap-vue/src/index.scss';
@import 'vue-select/src/scss/vue-select.scss';
</style>

<!-- NOTE: This file was copied from src/App.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->

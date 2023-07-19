<template>
  <div id="app">
    <Navigation />
  </div>
</template>

<style lang="scss">
@import 'bootstrap/scss/bootstrap.scss';
@import 'bootstrap-vue/src/index.scss';
@import 'vue-select/src/scss/vue-select.scss';
</style>

<script>
import '../../arpa_reporter/scss/index.scss';
import 'bootstrap/dist/js/bootstrap.min';

import Navigation from './components/Navigation.vue';

export default {
  name: 'App',
  components: {
    Navigation,
  },
};
</script>

<!-- NOTE: This file was copied from src/App.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->

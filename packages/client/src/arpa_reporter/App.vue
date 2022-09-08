<template>
  <div id="app">
    <Navigation />
  </div>
</template>

<script>
import '../../arpa_reporter/scss/index.scss'
import 'bootstrap/dist/js/bootstrap.min.js'

import Navigation from './components/Navigation.vue'

export default {
  name: 'App',
  components: {
    Navigation
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>

<!-- NOTE: This file was copied from src/App.vue (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z -->

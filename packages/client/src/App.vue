<template>
  <div id="app">
    <Navigation />
  </div>
</template>

<script>
import Navigation from '@/components/Navigation.vue';

export default {
  name: 'App',
  components: {
    Navigation,
  },
};
</script>

<style lang="scss">
@import '../../node_modules/bootstrap/scss/bootstrap.scss';
@import '../../node_modules/bootstrap-vue/src/index.scss';

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
body {
  font-size: .875rem;
}

</style>

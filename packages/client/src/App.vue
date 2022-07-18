<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>

export default {
  name: 'App',
  components: {
  },
};
</script>

<style lang="scss">
@import 'bootstrap/scss/bootstrap.scss';
@import 'bootstrap-vue/src/index.scss';
@import 'vue-select/src/scss/vue-select.scss';

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

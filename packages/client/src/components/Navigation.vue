<template>
  <div>
    <b-navbar>
        <template slot="brand">
            <b-navbar-item tag="router-link" :to="{ path: '/' }">
                <img
                    src="https://www.usdigitalresponse.org/wp-content/uploads/2020/05/logo_usdr_website_black_700.png"
                >
            </b-navbar-item>
        </template>
        <template slot="start">
            <b-navbar-item href="#">
                Home
            </b-navbar-item>
        </template>
    </b-navbar>
    <router-view />
  </div>
</template>

<script>

export default {
  name: 'Navigation',
  computed: {
  },
  methods: {
  },
};
</script>

<style scoped>
</style>

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
    </b-navbar>
    <section class="section">
  <div class="columns">
    <aside class="column is-2 is-fullheight">
      <b-menu>
      <b-menu-list label="Menu">
        <b-menu-item icon="" label="Grants" href="#/grants"></b-menu-item>
        <b-menu-item icon="" label="Eligibility Codes" href="#/eligibility-codes"></b-menu-item>
        <b-menu-item icon="" label="Keywords" href="#/keywords"></b-menu-item>
      </b-menu-list>
    </b-menu>
    </aside>
    <div class="column is-10 container">
      <router-view />
    </div>
  </div>
</section>
</div>
</template>

<script>

export default {
  name: 'Navigation',
  data() {
    return {
      expandOnHover: false,
      mobile: 'reduce',
      reduce: false,
    };
  },
  computed: {
  },
  methods: {
  },
};
</script>

<style scoped lang="scss">

</style>

<template>
<div>
  <nav class="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
    <a class="navbar-brand col-sm-3 col-md-2 mr-0" href="#">USDR</a>
  </nav>
  <div class="container-fluid">
    <div class="row">
      <nav class="col-md-2 d-none d-md-block bg-light sidebar">
        <div class="sidebar-sticky">
          <ul class="nav flex-column">
            <li class="nav-item">
              <router-link
                to="/grants"
                v-slot="{ href, navigate, isActive }"
              >
                  <a :class="['nav-link', isActive && 'active']" :href="href" @click="navigate">
                  Grants
                </a>
              </router-link>
            </li>
            <li class="nav-item">
              <router-link
                to="/eligibility-codes"
                v-slot="{ href, navigate, isActive }"
              >
                  <a :class="['nav-link', isActive && 'active']" :href="href" @click="navigate">
                  Eligibility Codes
                </a>
              </router-link>
            </li>
            <li class="nav-item">
              <router-link
                to="/keywords"
                v-slot="{ href, navigate, isActive }"
              >
                  <a :class="['nav-link', isActive && 'active']" :href="href" @click="navigate">
                  Keywords
                </a>
              </router-link>
            </li>
          </ul>
        </div>
      </nav>
      <main role="main" class="col-md-9 ml-sm-auto col-lg-10 px-4">
        <router-view/>
      </main>
    </div>
  </div>
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

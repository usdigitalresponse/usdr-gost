<template>
<div>
   <b-navbar type="dark" variant="dark">
    <b-navbar-brand href="#">USDR</b-navbar-brand>

    <b-collapse id="nav-collapse" is-nav>

      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">

        <b-nav-text>{{agency ? agency.name : ''}}</b-nav-text>

        <b-nav-item-dropdown right v-if="loggedInUser">
          <!-- Using 'button-content' slot -->
          <template #button-content>
            <em>User</em>
          </template>
          <b-dropdown-item-button href="#" @click="logout">Sign Out</b-dropdown-item-button>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
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
            <li class="nav-item" v-if="loggedInUser.role.name === 'admin'">
              <router-link
                to="/users"
                v-slot="{ href, navigate, isActive }"
              >
                  <a :class="['nav-link', isActive && 'active']" :href="href" @click="navigate">
                  Users
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
import { mapGetters } from 'vuex';

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
    ...mapGetters({
      agency: 'users/agency',
      loggedInUser: 'users/loggedInUser',
    }),
  },
  methods: {
    logout(e) {
      e.preventDefault();
      this.$store
        .dispatch('users/logout')
        .then(() => this.$router.push({ path: '/login' }));
    },
  },
};
</script>

<style scoped lang="scss">

.feather {
  width: 16px;
  height: 16px;
  vertical-align: text-bottom;
}

/*
 * Sidebar
 */

.sidebar {
  z-index: 100; /* Behind the navbar */
  padding: 0;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, .1);
}

.sidebar-sticky {
  height: 100vh;
  padding-top: .5rem;
  overflow-x: hidden;
  overflow-y: auto; /* Scrollable contents if viewport is shorter than content. */
}

@supports ((position: -webkit-sticky) or (position: sticky)) {
  .sidebar-sticky {
    position: -webkit-sticky;
    position: sticky;
  }
}

.sidebar .nav-link {
  font-weight: 500;
  color: #333;
}

.sidebar .nav-link .feather {
  margin-right: 4px;
  color: #999;
}

.sidebar .nav-link.active {
  color: #007bff;
}

.sidebar .nav-link:hover .feather,
.sidebar .nav-link.active .feather {
  color: inherit;
}

.sidebar-heading {
  font-size: .75rem;
  text-transform: uppercase;
}

/*
 * Content
 */

[role="main"] {
  padding-top: 48px;
}
</style>

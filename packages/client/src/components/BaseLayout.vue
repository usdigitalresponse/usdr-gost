<template>
  <div>
    <b-navbar
      type="light"
      variant="white"
      class="header-dropshadow py-1"
    >
      <b-navbar-brand
        :to="{ name: 'grants' }"
        class="d-flex align-items-center"
      >
        <b-img
          :src="require('../assets/usdr_logo_standard_wide.svg')"
          style="height: 2.5rem;"
          alt="United States Digital Response - Home"
        />
        <h1 class="ml-3 mb-0 h4">
          Federal Grant Finder
        </h1>
      </b-navbar-brand>
      <b-collapse
        id="nav-collapse"
        is-nav
      >
        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item-dropdown
            v-if="loggedInUser"
            right
            no-caret
            menu-class="w-100"
          >
            <!-- Using 'button-content' slot -->
            <template
              #button-content
            >
              <div
                class="d-inline-flex justify-content-start align-items-center"
                style="width: 242px"
              >
                <UserAvatar
                  :user-name="loggedInUser.name"
                  :color="loggedInUser.avatar_color"
                  size="2.5rem"
                />
                <div class="ml-2 mr-5 text-black">
                  <p class="m-0 font-weight-bold">
                    {{ loggedInUser.name }}
                  </p>
                  <p class="m-0">
                    {{ selectedTeam ? selectedTeam.name : '' }}
                  </p>
                </div>
                <p class="text-black m-0 ml-auto">
                  <b-icon
                    icon="caret-down-fill"
                    scale="0.8"
                  />
                </p>
              </div>
            </template>
            <b-dropdown-item :to="{ name: 'myProfile' }">
              <b-icon
                icon="person-circle"
                scale="1"
                class="dropdown-icon"
              />
              <p class="dropdown-item-text">
                My profile
              </p>
            </b-dropdown-item>
            <b-dropdown-item-button
              href="#"
              @click="giveFeedback"
            >
              <b-icon
                icon="chat-square-text"
                scale="1"
                class="dropdown-icon"
              />
              <p class="dropdown-item-text">
                Give feedback
              </p>
            </b-dropdown-item-button>
            <b-dropdown-item-button
              href="#"
              @click="trainingGuide"
            >
              <b-icon
                icon="book"
                scale="1"
                class="dropdown-icon"
              />
              <p class="dropdown-item-text">
                Training guide
              </p>
            </b-dropdown-item-button>
            <b-dropdown-item-button
              href="#"
              @click="logout"
            >
              <b-icon
                icon="box-arrow-right"
                scale="1"
                class="dropdown-icon"
              />
              <p class="dropdown-item-text">
                Sign out
              </p>
            </b-dropdown-item-button>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <b-col
      v-if="showTabs"
      cols="12"
    >
      <b-nav
        tabs
        justified
        fill
        style="margin-top: 20px"
      >
        <b-nav-item
          to="/grants"
          active-class="active"
        >
          Browse Grants
        </b-nav-item>
        <b-nav-item
          to="/my-grants"
          active-class="active"
        >
          My Grants
        </b-nav-item>
        <b-nav-item
          to="/dashboard"
          active-class="active"
        >
          Dashboard
        </b-nav-item>
        <b-nav-item
          v-if="userRole === 'admin'"
          to="/users"
          active-class="active"
        >
          Users
        </b-nav-item>
        <b-nav-item
          :to="newTerminologyEnabled ? '/teams' : '/agencies'"
          active-class="active"
        >
          {{ newTerminologyEnabled ? 'Teams' : 'Agencies' }}
        </b-nav-item>
        <b-nav-item
          v-if="canSeeOrganizationsTab"
          :to="newTerminologyEnabled ? '/organizations' : '/tenants'"
          active-class="active"
        >
          {{ newTerminologyEnabled ? 'Organizations' : 'Tenants' }}
        </b-nav-item>
      </b-nav>
    </b-col>

    <div style="margin-top: 10px">
      <section
        class="container-fluid"
        style="display: flex; justify-content: center;"
      >
        <AlertBox
          v-for="(alert, alertId) in alerts"
          :key="alertId"
          v-bind="alert"
          @dismiss="dismissAlert(alertId)"
        />
      </section>

      <router-view />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { newTerminologyEnabled } from '@/helpers/featureFlags';
import AlertBox from '@/arpa_reporter/components/AlertBox.vue';
import UserAvatar from '@/components/UserAvatar.vue';

export default {
  name: 'BaseLayout',
  components: {
    AlertBox,
    UserAvatar,
  },
  data() {
    return {
      showOptInEmailBanner: true,
    };
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
      userRole: 'users/userRole',
      selectedTeam: 'users/selectedAgency',
      alerts: 'alerts/alerts',
    }),
    canSeeOrganizationsTab() {
      return this.loggedInUser && this.loggedInUser.isUSDRSuperAdmin;
    },
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
    showTabs() {
      return !(this.$route.meta.hideLayoutTabs === true);
    },
  },
  methods: {
    logout(e) {
      e.preventDefault();
      this.$store
        .dispatch('users/logout')
        .then(() => this.$router.push({ path: '/login' }));
    },
    giveFeedback() {
      window.open('https://usdr.link/grants/feedback');
    },
    trainingGuide() {
      window.open('https://go.usdigitalresponse.org/hubfs/Grants/USDR-Federal-Grants-Finder-User-Guide-Sep2023.pdf', '_blank');
    },
    dismissAlert(alertId) {
      this.$store.commit('alerts/dismissAlert', alertId);
    },
  },
};
</script>

<style scoped lang="scss">
.dropdown-icon {
  margin-right: 1rem;
}

.dropdown-item-text {
  font-size: 14px;
  display: inline;
  text-align: left;
  padding: 0;
}
.text-black {
  color: #000;
}
</style>

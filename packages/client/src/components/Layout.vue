<template>
  <div>
    <b-navbar :type="navBarType" :variant="navBarVariant">
      <b-navbar-brand href="/#/grants" class="d-flex align-items-center">
      <b-img v-if="myProfileEnabled" :src="require('../assets/usdr_logo_standard_wide.svg')" style="height: 1.625rem;" class="" alt="United States Digital Response logo" />
      <b-img v-else :src="require('../assets/usdr_logo_white_wide.svg')" style="height: 1.625rem;" class="" alt="United States Digital Response logo in white" />
      <h3 class="ml-3 mb-0">Grants Identification Tool</h3>
    </b-navbar-brand>
      <b-collapse id="nav-collapse" is-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">

          <b-nav-text>
            <b-badge>{{selectedAgency ? selectedAgency.name : ''}}</b-badge>
          </b-nav-text>

          <b-nav-item-dropdown right v-if="loggedInUser" menu-class="w-100">
            <!-- Using 'button-content' slot -->
            <template #button-content>
              <em>{{loggedInUser.email}}</em>
            </template>
            <b-dropdown-item v-if="myProfileEnabled" href="#/my-profile">
              <b-icon icon="person-circle" scale="1"></b-icon>
              My profile
            </b-dropdown-item>
            <b-dropdown-item-button v-else href="#" @click="settingsClicked">Settings</b-dropdown-item-button>
            <b-dropdown-item-button v-if="myProfileEnabled" href="#" @click="giveFeedback">
              <b-icon icon="chat-square-text" scale="1"></b-icon>
              Give feedback
            </b-dropdown-item-button>
            <b-dropdown-item-button v-else href="#" @click="giveFeedback">Give Feedback</b-dropdown-item-button>
            <b-dropdown-item-button v-if="myProfileEnabled" href="#" @click="trainingGuide">
              <b-icon icon="book" scale="1"></b-icon>
              Training guide
            </b-dropdown-item-button>
            <b-dropdown-item-button v-else href="#" @click="trainingGuide">Training Guide</b-dropdown-item-button>
            <b-dropdown-item-button v-if="myProfileEnabled" href="#" @click="logout">
              <b-icon icon="box-arrow-right" scale="1"></b-icon>
              Sign out
            </b-dropdown-item-button>
            <b-dropdown-item-button v-else href="#" @click="logout">Sign Out</b-dropdown-item-button>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <b-col cols="12" v-if="showTabs">
      <b-nav tabs justified fill style="margin-top: 20px">
          <b-nav-item to="/my-grants" exact exact-active-class="active">My Grants</b-nav-item>
          <b-nav-item to="/grants" exact exact-active-class="active">Browse Grants</b-nav-item>
          <b-nav-item v-if="!useNewGrantsTable" to="/eligibility-codes" exact exact-active-class="active">Eligibility Codes</b-nav-item>
          <b-nav-item v-if="!useNewGrantsTable" to="/keywords" exact exact-active-class="active">Keywords</b-nav-item>
          <b-nav-item to="/dashboard" exact exact-active-class="active">Dashboard</b-nav-item>
          <b-nav-item to="/users" exact exact-active-class="active" v-if="userRole === 'admin'">Users</b-nav-item>
          <b-nav-item to="/Agencies" exact exact-active-class="active">Agencies</b-nav-item>
          <b-nav-item v-if="canSeeTenantsTab" to="/tenants" exact exact-active-class="active">Tenants</b-nav-item>
      </b-nav>
    </b-col>

    <div style="margin-top: 10px">
      <section class="container-fluid" style="display: flex; justify-content: center;">
        <AlertBox v-for="(alert, alertId) in alerts" :key="alertId" v-bind="alert" v-on:dismiss="dismissAlert(alertId)" />
      </section>

      <router-view />
    </div>
    <ProfileSettingsModal
    :showModal.sync="showProfileSettingModal"/>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { myProfileEnabled, useNewGrantsTable } from '@/helpers/featureFlags';
import ProfileSettingsModal from '@/components/Modals/ProfileSettings.vue';
import AlertBox from '../arpa_reporter/components/AlertBox.vue';

export default {
  name: 'Layout',
  components: {
    AlertBox,
    ProfileSettingsModal,
  },
  data() {
    return {
      showProfileSettingModal: false,
      showOptInEmailBanner: true,
    };
  },
  computed: {
    ...mapGetters({
      agency: 'users/agency',
      loggedInUser: 'users/loggedInUser',
      userRole: 'users/userRole',
      selectedAgency: 'users/selectedAgency',
      alerts: 'alerts/alerts',
    }),
    canSeeTenantsTab() {
      return this.loggedInUser && this.loggedInUser.isUSDRSuperAdmin;
    },
    myProfileEnabled() {
      return myProfileEnabled();
    },
    useNewGrantsTable() {
      return useNewGrantsTable();
    },
    showTabs() {
      return !(this.$route.meta.hideLayoutTabs === true);
    },
    navBarType() {
      return myProfileEnabled() ? 'light' : 'dark';
    },
    navBarVariant() {
      return myProfileEnabled() ? 'white' : 'dark';
    },
  },
  methods: {
    logout(e) {
      e.preventDefault();
      this.$store
        .dispatch('users/logout')
        .then(() => this.$router.push({ path: '/login' }));
    },
    settingsClicked() {
      this.showProfileSettingModal = true;
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
</style>

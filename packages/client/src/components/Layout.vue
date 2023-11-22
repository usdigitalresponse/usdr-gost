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
          <b-nav-item-dropdown right v-if="loggedInUser && myProfileEnabled" no-caret>
            <!-- Using 'button-content' slot -->
            <template v-if="myProfileEnabled" #button-content>
              <div class="d-inline-flex justify-content-start align-items-center" style="width: 242px">
                <UserAvatar size="2.5rem"/>
                <div class="ml-2 mr-5 text-black">
                  <p class="m-0 font-weight-bold">{{ loggedInUser.name }}</p>
                  <p class="m-0">{{ selectedAgency ? selectedAgency.name : '' }}</p>
                </div>
                <p class="text-black m-0 ml-auto"><b-icon icon="caret-down-fill" scale="0.8"></b-icon></p>
              </div>
            </template>
            <template v-else #button-content>
              <em>{{loggedInUser.email}}</em>
            </template>
            <b-dropdown-item-button href="#" @click="settingsClicked">Settings</b-dropdown-item-button>
            <b-dropdown-item-button href="#" @click="giveFeedback">Give Feedback</b-dropdown-item-button>
            <b-dropdown-item-button href="#" @click="trainingGuide">Training Guide</b-dropdown-item-button>
            <b-dropdown-item-button href="#" @click="logout">Sign Out</b-dropdown-item-button>
          </b-nav-item-dropdown>

          <b-nav-text v-if="!myProfileEnabled">
            <b-badge>{{selectedAgency ? selectedAgency.name : ''}}</b-badge>
          </b-nav-text>

          <b-nav-item-dropdown right v-if="loggedInUser && !myProfileEnabled">
            <!-- Using 'button-content' slot -->
            <template #button-content>
              <em>{{loggedInUser.email}}</em>
            </template>
            <b-dropdown-item-button href="#" @click="settingsClicked">Settings</b-dropdown-item-button>
            <b-dropdown-item-button href="#" @click="giveFeedback">Give Feedback</b-dropdown-item-button>
            <b-dropdown-item-button href="#" @click="trainingGuide">Training Guide</b-dropdown-item-button>
            <b-dropdown-item-button href="#" @click="logout">Sign Out</b-dropdown-item-button>
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
          <b-nav-item :to="newTerminologyEnabled ? '/teams' : '/agencies'" exact exact-active-class="active">{{newTerminologyEnabled ? 'Teams' : 'Agencies'}}</b-nav-item>
          <b-nav-item v-if="canSeeOrganizationsTab" :to="newTerminologyEnabled ? '/organizations' : '/tenants'" exact exact-active-class="active">{{newTerminologyEnabled ? 'Organizations' : 'Tenants'}}</b-nav-item>
      </b-nav>
    </b-col>

    <div style="margin-top: 10px">
      <section class="container-fluid" style="display: flex; justify-content: center;">
        <AlertBox v-for="(alert, alertId) in alerts" :key="alertId" v-bind="alert" v-on:dismiss="dismissAlert(alertId)" />
      </section>

      <router-view />
    </div>
    <ProfileSettingsModal :showModal.sync="showProfileSettingModal"/>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { myProfileEnabled, newTerminologyEnabled, useNewGrantsTable } from '@/helpers/featureFlags';
import ProfileSettingsModal from '@/components/Modals/ProfileSettings.vue';
import AlertBox from '../arpa_reporter/components/AlertBox.vue';
import UserAvatar from './UserAvatar.vue';

export default {
  name: 'Layout',
  components: {
    AlertBox,
    ProfileSettingsModal,
    UserAvatar,
  },
  data() {
    return {
      showProfileSettingModal: false,
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
      return true;
    },
    newTerminologyEnabled() {
      return newTerminologyEnabled();
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
.text-black {
  color: #000;
}
</style>

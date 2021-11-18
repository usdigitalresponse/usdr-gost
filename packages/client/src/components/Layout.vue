<template>
  <div>
    <b-navbar type="dark" variant="dark">
      <b-navbar-brand href="/#/grants">Grants Identification Tool</b-navbar-brand>

      <b-collapse id="nav-collapse" is-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">

          <b-nav-text>
            <b-badge>{{selectedAgency ? selectedAgency.name : ''}}</b-badge>
          </b-nav-text>

          <b-nav-item-dropdown right v-if="loggedInUser">
            <!-- Using 'button-content' slot -->
            <template #button-content>
              <em>{{loggedInUser.email}}</em>
            </template>
            <b-dropdown-item-button href="#" @click="settingsClicked">Settings</b-dropdown-item-button>
            <b-dropdown-item-button href="#" @click="logout">Sign Out</b-dropdown-item-button>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <b-nav tabs justified style="margin-top: 20px">
        <b-nav-item to="/dashboard" exact exact-active-class="active">Dashboard</b-nav-item>
        <b-nav-item to="/my-grants" exact exact-active-class="active">My Grants</b-nav-item>
        <b-nav-item to="/grants" exact exact-active-class="active">Grants</b-nav-item>
        <b-nav-item to="/eligibility-codes" exact exact-active-class="active">Eligibility Codes</b-nav-item>
        <b-nav-item to="/keywords" exact exact-active-class="active">Keywords</b-nav-item>
        <b-nav-item to="/users" exact exact-active-class="active" v-if="userRole === 'admin'">Users</b-nav-item>
        <b-nav-item to="/Agencies" exact exact-active-class="active">Agencies</b-nav-item>
    </b-nav>
    <div style="margin-top: 10px">
      <router-view />
    </div>
    <ProfileSettingsModal
     :showModal.sync="showProfileSettingModal"/>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import ProfileSettingsModal from '@/components/Modals/ProfileSettings.vue';

export default {
  name: 'Layout',
  components: {
    ProfileSettingsModal,
  },
  data() {
    return {
      showProfileSettingModal: false,
    };
  },
  computed: {
    ...mapGetters({
      agency: 'users/agency',
      loggedInUser: 'users/loggedInUser',
      userRole: 'users/userRole',
      selectedAgency: 'users/selectedAgency',
    }),
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
  },
};
</script>

<style scoped lang="scss">
</style>

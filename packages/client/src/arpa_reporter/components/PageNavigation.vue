<template>
  <div
    class="container-fluid"
    style="width: 90%"
  >
    <nav class="row navbar navbar-expand navbar-light bg-light">
      <a
        class="navbar-brand"
        href="#"
      >
        {{ applicationTitle }}
        <span v-if="agencyName"> : {{ agencyName }}</span>
      </a>

      <span
        v-if="viewPeriod"
        class="usdr-navbar-text"
      >Reporting Period Ending:</span>

      <div
        v-if="viewPeriod"
        id="navbarNavDropdown"
        class="collapse navbar-collapse"
      >
        <ul class="navbar-nav mr-auto">
          <li class="nav-item dropdown active">
            <a
              id="periodDropdown"
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              {{ viewPeriod.name }}
            </a>

            <div
              class="dropdown-menu"
              aria-labelledby="periodDropdown"
            >
              <button
                v-for="period in viewablePeriods"
                :key="period.id"
                class="dropdown-item"
                @click="() => setViewPeriodID(period.id)"
              >
                {{ period.name }}
              </button>
            </div>
          </li>
        </ul>

        <span class="usdr-navbar-text">{{ email }}</span>

        <ul class="navbar-nav">
          <li
            v-if="loggedIn"
            class="nav-item"
          >
            <a
              href="#"
              class="usdr-nav-link"
              @click="logout"
            >Logout</a>
          </li>
        </ul>
      </div>
    </nav>
    <main>
      <ul
        v-if="loggedIn"
        class="row nav nav-tabs mb-2"
      >
        <li class="nav-item">
          <router-link
            :class="navLinkClass('/')"
            to="/"
          >
            Dashboard
          </router-link>
        </li>

        <li class="nav-item">
          <router-link
            :class="navLinkClass('/uploads')"
            to="/uploads"
          >
            Uploads
          </router-link>
        </li>

        <li
          v-if="role === 'admin'"
          class="nav-item"
        >
          <router-link
            :class="navLinkClass('/agencies')"
            to="/agencies"
          >
            Agencies
          </router-link>
        </li>

        <li
          v-if="role === 'admin'"
          class="nav-item"
        >
          <router-link
            :class="navLinkClass('/subrecipients')"
            to="/subrecipients"
          >
            Subrecipients
          </router-link>
        </li>

        <li
          v-if="role === 'admin'"
          class="nav-item"
        >
          <router-link
            :class="navLinkClass('/users')"
            to="/users"
          >
            Users
          </router-link>
        </li>

        <li
          v-if="role === 'admin'"
          class="nav-item"
        >
          <router-link
            :class="navLinkClass('/reporting_periods')"
            to="/reporting_periods"
          >
            Reporting Periods
          </router-link>
        </li>
      </ul>

      <AlertBox
        v-for="(alert, alertId) in alerts"
        v-bind="alert"
        :key="alertId"
        @dismiss="dismissAlert(alertId)"
      />

      <router-view />
    </main>
  </div>
</template>

<script>
import moment from 'moment';
import AlertBox from '@/arpa_reporter/components/AlertBox.vue';
import { titleize } from '@/helpers/form-helpers';

export default {
  name: 'PageNavigation',
  components: {
    AlertBox,
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    email() {
      return this.user.email;
    },
    agencyName() {
      return this.$store.getters.agencyName(this.user.agency_id);
    },
    role() {
      return this.$store.getters.user.role.name;
    },
    loggedIn() {
      return this.$store.state.user !== null;
    },
    viewablePeriods() {
      return this.$store.getters.viewableReportingPeriods;
    },
    viewPeriod() {
      return this.$store.getters.viewPeriod;
    },
    applicationTitle() {
      // NOTE(mbroussard): this getter will always default to "ARPA Reporter" in logged out view since we don't
      // have application_settings yet
      return this.$store.getters.applicationTitle;
    },
    alerts() {
      return this.$store.state.alerts;
    },
  },
  watch: {
  },
  methods: {
    titleize,
    dismissAlert(alertId) {
      this.$store.commit('dismissAlert', alertId);
    },
    logout(e) {
      e.preventDefault();
      this.$store
        .dispatch('logout')
        .then(() => this.$router.push({ path: '/login' }));
    },
    navLinkClass(to) {
      if (this.$route.path === to) {
        return 'nav-link usdr-link active';
      }
      return 'nav-link usdr-link';
    },
    dateFormat(d) {
      return moment(d)
        .utc()
        .format('MM-DD-YYYY');
    },
    setViewPeriodID(newID) {
      return this.$store
        .dispatch('setViewPeriodID', newID)
        .catch((e) => { this.errorMessage = e.message; });
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/components/Navigation.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->

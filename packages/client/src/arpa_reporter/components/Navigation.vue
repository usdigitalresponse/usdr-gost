<template>
  <div class="container-fluid" style="width: 90%">
    <nav class="row navbar navbar-expand navbar-light bg-light">
      <a class="navbar-brand" href="#">
        {{ applicationTitle }}
        <span v-if="agencyName"> : {{ agencyName }}</span>
      </a>

      <span class="navbar-text" v-if="viewPeriod">Reporting Period Ending:</span>

      <div class="collapse navbar-collapse" id="navbarNavDropdown" v-if="viewPeriod">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item dropdown active">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="periodDropdown"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false">
              {{ viewPeriod.name }}
            </a>

            <div class="dropdown-menu" aria-labelledby="periodDropdown">
              <a
                class="dropdown-item"
                v-for="period in viewablePeriods"
                :key="period.id"
                >
                <div @click="() => setViewPeriodID(period.id)">
                  {{ period.name }}
                </div>
              </a>
            </div>
          </li>
        </ul>

        <span class="navbar-text">{{ email }}</span>

        <ul class="navbar-nav">
          <li class="nav-item" v-if="loggedIn">
            <a href="#" @click="logout" class="nav-link">Logout</a>
          </li>
        </ul>
      </div>
    </nav>

    <ul class="row nav nav-tabs mb-2" v-if="loggedIn">
      <li class="nav-item">
        <router-link :class="navLinkClass('/')" to="/">Dashboard</router-link>
      </li>

      <li class="nav-item">
        <router-link :class="navLinkClass('/uploads')" to="/uploads">Uploads</router-link>
      </li>

      <li class="nav-item" v-if="role === 'admin'">
        <router-link :class="navLinkClass('/agencies')" to="/agencies">Agencies</router-link>
      </li>

      <li class="nav-item" v-if="role === 'admin'">
        <router-link :class="navLinkClass('/subrecipients')" to="/subrecipients">
          Subrecipients
        </router-link>
      </li>

      <li class="nav-item" v-if="role === 'admin'">
        <router-link :class="navLinkClass('/users')" to="/users">Users</router-link>
      </li>

      <li class="nav-item" v-if="role === 'admin'">
        <router-link :class="navLinkClass('/reporting_periods')" to="/reporting_periods">
          Reporting Periods
        </router-link>
      </li>

      <li class="nav-item" v-if="role === 'admin'">
        <router-link :class="navLinkClass('/validation')" to="/validation">
          Validation
        </router-link>
      </li>
    </ul>

    <AlertBox v-for="(alert, alertId) in alerts" :key="alertId" v-bind="alert" v-on:dismiss="dismissAlert(alertId)" />

    <router-view />
  </div>
</template>

<script>
import AlertBox from './AlertBox'
import { titleize } from '../helpers/form-helpers'
import moment from 'moment'

export default {
  name: 'Navigation',
  components: {
    AlertBox
  },
  computed: {
    user: function () {
      return this.$store.getters.user
    },
    email: function () {
      return this.user.email
    },
    agencyName: function () {
      return this.$store.getters.agencyName(this.user.agency_id)
    },
    role: function () {
      return this.$store.getters.user.role.name
    },
    loggedIn: function () {
      return this.$store.state.user !== null
    },
    viewablePeriods: function () {
      return this.$store.getters.viewableReportingPeriods
    },
    viewPeriod: function () {
      return this.$store.getters.viewPeriod
    },
    applicationTitle: function () {
      // NOTE(mbroussard): this getter will always default to "ARPA Reporter" in logged out view since we don't
      // have application_settings yet
      return this.$store.getters.applicationTitle
    },
    alerts: function () {
      return this.$store.state.alerts
    }
  },
  watch: {
  },
  methods: {
    titleize,
    dismissAlert (alertId) {
      this.$store.commit('dismissAlert', alertId)
    },
    logout (e) {
      e.preventDefault()
      this.$store
        .dispatch('logout')
        .then(() => this.$router.push({ path: '/login' }))
    },
    navLinkClass (to) {
      if (this.$route.path === to) {
        return 'nav-link active'
      }
      return 'nav-link'
    },
    dateFormat: function (d) {
      return moment(d)
        .utc()
        .format('MM-DD-YYYY')
    },
    setViewPeriodID: function (newID) {
      return this.$store
        .dispatch('setViewPeriodID', newID)
        .catch(e => (this.errorMessage = e.message))
    }
  }
}
</script>

<!-- NOTE: This file was copied from src/components/Navigation.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->

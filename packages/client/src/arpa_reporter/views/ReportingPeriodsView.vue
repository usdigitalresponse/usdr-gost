<template>
  <div>
    <h1>Reporting Periods</h1>

    <div class="mb-4">
      <router-link
        to="/reporting_periods/new"
        class="btn usdr-btn-primary"
      >
        Create New Reporting Period
      </router-link>
    </div>

    <table class="mt-3 table table-striped">
      <thead class="thead-light">
        <tr>
          <th>Name</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Template</th>
          <th />
          <th>Certified At</th>
          <th />
        </tr>
      </thead>
      <tbody
        v-for="(p, n) in reportingPeriods"
        :key="n"
      >
        <tr :key="n">
          <td>{{ p.name }}</td>
          <td>{{ formatDate(p.start_date) }}</td>
          <td>{{ formatDate(p.end_date) }}</td>
          <td>{{ p.template_filename }}</td>
          <td>
            <router-link
              v-if="!p.certified_at"
              :to="`/new_template/${p.id}`"
              class="usdr-link"
            >
              Upload Template
            </router-link>
          </td>
          <td>
            <span v-if="isCurrentReportingPeriod(p)">
              <button
                class="btn usdr-btn-primary"
                data-toggle="modal"
                data-target="#certify-reporting-period"
                :disabled="certifying"
              >{{ certifyLabel }}</button>
            </span>
            <span v-else-if="p.certified_at">
              {{ formatDate(p.certified_at) }} by {{ p.certified_by_email }}
            </span>
          </td>
          <td>
            <router-link
              v-if="!p.certified_at"
              :to="`/reporting_periods/${p.id}`"
              class="btn btn-sm btn-secondary"
            >
              Edit
            </router-link>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      id="certify-reporting-period"
      class="modal fade"
      tabindex="-1"
      role="dialog"
    >
      <div
        class="modal-dialog"
        role="document"
      >
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Certify Reporting Period
            </h5>
            <button
              ref="closeModal"
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>Certify the <b>{{ currentPeriod.name }}</b> period?</p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn usdr-btn-primary"
              @click="handleCertify"
            >
              Certify
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              data-dismiss="modal"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import moment from 'moment';
import { post } from '@/arpa_reporter/store';

export default {
  data() {
    return {
      certifying: false,
    };
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    reportingPeriods() {
      return _.sortBy(this.$store.state.reportingPeriods, ['start_date']);
    },
    currentPeriod() {
      return this.$store.getters.currentReportingPeriod;
    },
    certifyLabel() {
      return this.certifying ? 'Certifying Reporting Period...' : 'Certify Reporting Period';
    },
  },
  methods: {
    isCurrentReportingPeriod(p) {
      if (this.$store.getters.currentReportingPeriod) {
        return p.id === this.$store.getters.currentReportingPeriod.id;
      }
      return false;
    },
    reportPeriodUrl(p) {
      return `/reporting_periods/${p.id}`;
    },
    async handleCertify() {
      this.certifying = true;
      this.$refs.closeModal.click();

      try {
        const result = await post('/api/reporting_periods/close', {});
        if (result.error) throw new Error(result.error);

        this.$store.dispatch('updateReportingPeriods');
        this.$store.dispatch('updateApplicationSettings');
      } catch (e) {
        this.$store.commit('addAlert', {
          text: `Error certifying reporting period: ${e.message}`,
          level: 'err',
        });
      }

      this.certifying = false;
    },
    formatDate(d) {
      return moment(d).utc().format('MM/DD/YYYY');
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/views/ReportingPeriods.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->

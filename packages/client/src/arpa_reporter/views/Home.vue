<template>
  <div>
    <div class="row">
      <AlertBox
        v-if="alert"
        :text="alert.text"
        :level="alert.level"
        @dismiss="clearAlert"
      />
    </div>

    <div
      v-if="!viewingOpenPeriod"
      class="row border border-danger rounded m-3 mb-3 p-3"
    >
      <div
        id="closedReportingPeriodMessage"
        class="col"
      >
        This reporting period is closed.
      </div>
    </div>

    <div
      v-if="viewingOpenPeriod || isAdmin"
      class="row mt-5 mb-5"
    >
      <div
        v-if="isAdmin"
        class="col"
      >
        <button
          id="sendTreasuryReportButton"
          class="btn btn-primary btn-block"
          :disabled="sending"
          @click="sendTreasuryReport"
        >
          <span v-if="sending">Sending...</span>
          <span v-else>Send Treasury Report by Email</span>
        </button>
      </div>

      <div
        v-if="isAdmin"
        class="col"
      >
        <button
          id="sendAuditReportButton"
          class="btn btn-info btn-block"
          :disabled="sending"
          @click="sendAuditReport"
        >
          <span v-if="sending">Sending...</span>
          <span v-else>Send Audit Report by Email</span>
        </button>
      </div>

      <div
        v-if="viewingOpenPeriod"
        class="col"
      >
        <button
          id="submitWorkbookButton"
          class="btn btn-primary btn-block"
          :disabled="!viewingOpenPeriod"
          @click.prevent="startUpload"
        >
          Submit Workbook
        </button>
      </div>

      <div
        v-if="viewingOpenPeriod"
        class="col"
      >
        <DownloadTemplateBtn :block="true" />
      </div>
    </div>

    <p id="welcomeToArpaReporter">
      Welcome to the ARPA reporter.
      To get started, click the "Download Empty Template" button, above, to get a copy of an empty template for reporting.
    </p>

    <p>
      You will need to fill out one template for every EC code that your agency uses.
      Once you've filled out a template, please return here to submit it.
      To do that, click the "Submit Workbook" button, above.
      You can only submit workbooks for the currently-open reporting period.
    </p>

    <p>
      To view a list of all submitted workbooks, please click on the "Uploads" tab.
    </p>
  </div>
</template>

<script>
import AlertBox from '../components/AlertBox.vue';
import DownloadTemplateBtn from '../components/DownloadTemplateBtn.vue';
import { getJson } from '../store/index';

export default {
  name: 'Home',
  components: {
    DownloadTemplateBtn,
    AlertBox,
  },
  data() {
    let alert;
    if (this.$route?.query?.alert_text) {
      /* ok, warn, err */
      alert = {
        text: this.$route.query.alert_text,
        level: this.$route.query.alert_level,
      };
    }

    return {
      alert,
      sending: false,
    };
  },
  computed: {
    isAdmin() {
      return this.role === 'admin';
    },
    role() {
      return this.$store.getters.user.role.name;
    },
    viewingOpenPeriod() {
      return this.$store.getters.viewPeriodIsCurrent;
    },
  },
  methods: {
    clearAlert() {
      this.alert = null;
    },
    async sendAuditReport() {
      this.sending = true;

      try {
        const periodId = this.$store.getters.viewPeriod.id || 0;
        const query = new URLSearchParams({ queue: true });
        if (periodId && !this.viewingOpenPeriod) {
          query.set('period_id', periodId);
        }
        const result = await getJson(`/api/audit_report?${query}`);

        if (result.error) {
          this.alert = {
            text: 'Something went wrong. Unable to send an email containing the audit report. Reach out to grants-helpdesk@usdigitalresponse.org if this happens again.',
            level: 'err',
          };
          console.log(result.error);
        } else {
          this.alert = {
            text: 'Sent. Please note, it could take up to 1 hour for this email to arrive.',
            level: 'ok',
          };
        }
      } catch (error) {
        // we got an error from the backend, but the backend didn't send reasons
        this.alert = {
          text: 'Something went wrong. Unable to send an email containing the audit report. Reach out to grants-helpdesk@usdigitalresponse.org if this happens again.',
          level: 'err',
        };
      }

      this.sending = false;
    },
    async sendTreasuryReport() {
      this.sending = true;

      try {
        const periodId = this.$store.getters.viewPeriod.id || 0;
        const query = new URLSearchParams({ queue: true });
        if (periodId && !this.viewingOpenPeriod) {
          query.set('period_id', periodId);
        }
        const result = await getJson(`/api/exports?${query}`);

        if (result.error) {
          this.alert = {
            text: 'Something went wrong. Unable to send an email containing the treasury report. Reach out to grants-helpdesk@usdigitalresponse.org if this happens again.',
            level: 'err',
          };
          console.log(result.error);
        } else {
          this.alert = {
            text: 'Sent. Please note, it could take up to 1 hour for this email to arrive.',
            level: 'ok',
          };
        }
      } catch (error) {
        // we got an error from the backend, but the backend didn't send reasons
        this.alert = {
          text: 'Something went wrong. Unable to send an email containing the treasury report. Reach out to grants-helpdesk@usdigitalresponse.org if this happens again.',
          level: 'err',
        };
      }

      this.sending = false;
    },
    startUpload() {
      if (this.viewingOpenPeriod) {
        this.$router.push({ path: '/new_upload' });
      }
    },
  },
};
</script>

<!-- NOTE: This file was copied from src/views/Home.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->

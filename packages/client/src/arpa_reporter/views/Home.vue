<template>
  <div>
    <div class="row">
      <AlertBox v-if="alert" :text="alert.text" :level="alert.level" v-on:dismiss="clearAlert" />
    </div>
    <div class="row" v-if="isAdmin">
      <AlertBox text="Service Interruption - Please reach out to grants-helpdesk@usdigitalresponse.org for audit report and treasury report generation." level="err" />
    </div>
    <div class="row mt-5 mb-5" v-if="viewingOpenPeriod">
      <div class="col" v-if="this.$route.query.sync_treasury_download && isAdmin">
        <DownloadButton :href="downloadTreasuryReportURL()" class="btn btn-primary btn-block">Download Treasury Report</DownloadButton>
      </div>

      <div class="col" v-if="isAdmin">
        <button disabled title="Please reach out to grants-helpdesk@usdigitalresponse.org for the treasury report." class="btn btn-primary btn-block" @click="sendTreasuryReport">
          <span v-if="sending">Sending...</span>
          <span v-else>Send Treasury Report by Email</span>
        </button>
      </div>

      <div class="col" v-if="this.$route.query.sync_audit_download && isAdmin">
        <DownloadButton :href="downloadAuditReportURL()" class="btn btn-info btn-block">Download Audit Report</DownloadButton>
      </div>

      <div class="col" v-if="isAdmin">
        <button disabled title="Please reach out to grants-helpdesk@usdigitalresponse.org for the audit report." class="btn btn-info btn-block" @click="sendAuditReport">
          <span v-if="sending">Sending...</span>
          <span v-else>Send Audit Report by Email</span>
        </button>
      </div>

      <div class="col">
        <button @click.prevent="startUpload" class="btn btn-primary btn-block">Submit Workbook</button>
      </div>

      <div class="col">
        <DownloadTemplateBtn :block="true" />
      </div>
    </div>

    <div class="row border border-danger rounded m-3 mb-3 p-3" v-else>
      <div class="col">
        This reporting period is closed.
      </div>
    </div>

    <p>
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
import { apiURL } from '@/helpers/fetchApi';
import AlertBox from '../components/AlertBox.vue';
import DownloadButton from '../components/DownloadButton.vue';
import DownloadTemplateBtn from '../components/DownloadTemplateBtn.vue';
import { getJson } from '../store/index';

export default {
  name: 'Home',
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
    isClosed() {
      return !(this.$store.getters.viewPeriodIsCurrent);
    },
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
  methods: {
    clearAlert() {
      this.alert = null;
    },
    downloadAuditReportURL() {
      return apiURL('/api/audit_report');
    },
    async sendAuditReport() {
      this.sending = true;

      try {
        const result = await getJson('/api/audit_report?async=true');

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
    downloadTreasuryReportURL() {
      const periodId = this.$store.getters.viewPeriod.id || 0;
      return apiURL(`/api/exports?period_id=${periodId}`);
    },
    async sendTreasuryReport() {
      this.sending = true;

      try {
        const result = await getJson('/api/exports?async=true');

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
  components: {
    DownloadButton,
    DownloadTemplateBtn,
    AlertBox,
  },
};
</script>

<!-- NOTE: This file was copied from src/views/Home.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
